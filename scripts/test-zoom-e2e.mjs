import fs from "fs"
import path from "path"
import crypto from "crypto"
import postgres from "postgres"

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local")
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n")
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eqIdx = trimmed.indexOf("=")
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim()
        let val = trimmed.slice(eqIdx + 1).trim()
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1)
        }
        if (!process.env[key]) {
          process.env[key] = val
        }
      }
    }
  }
}

loadEnv()

function getEncryptionKey() {
  const rawKey = process.env.APP_ENCRYPTION_KEY
  if (!rawKey) throw new Error("APP_ENCRYPTION_KEY is missing")
  if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
    return Buffer.from(rawKey, "hex")
  }
  if (Buffer.byteLength(rawKey, "utf8") === 32) {
    return Buffer.from(rawKey, "utf8")
  }
  return crypto.createHash("sha256").update(rawKey).digest()
}

function decrypt(encryptedText) {
  const parts = encryptedText.split(":")
  if (parts.length !== 3) throw new Error("Invalid format: expected iv:authTag:ciphertext")
  const [ivHex, authTagHex, dataHex] = parts
  const key = getEncryptionKey()
  const iv = Buffer.from(ivHex, "hex")
  const authTag = Buffer.from(authTagHex, "hex")
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv, {
    authTagLength: 16,
  })
  decipher.setAuthTag(authTag)
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ])
  return decrypted.toString("utf8")
}

async function run() {
  console.log("=== SOLULU ZOOM E2E VALIDATION SCRIPT ===")
  const sql = postgres(process.env.DATABASE_URL, { prepare: false, ssl: "require" })

  try {
    const accounts = await sql`SELECT * FROM zoom_accounts`
    console.log(`\n1. DATABASE CHECK: Found ${accounts.length} Zoom account(s) registered.`)
    
    for (const acc of accounts) {
      console.log(`\n--- Inspecting Account: ${acc.name} (${acc.email}) ---`)
      console.log(`ID: ${acc.id}`)
      console.log(`Account ID: ${acc.account_id}`)
      console.log(`Client ID: ${acc.client_id}`)
      console.log(`Is Active: ${acc.is_active}`)

      // Decrypt
      let clientSecret = ""
      try {
        clientSecret = decrypt(acc.client_secret_encrypted)
        console.log(`[PASS] Decryption: Secret successfully decrypted (length: ${clientSecret.length})`)
      } catch (decErr) {
        console.error(`[FAIL] Decryption error:`, decErr.message)
        continue
      }

      // Uji Koneksi / S2S OAuth
      console.log(`\n2. UJI KONEKSI (ZOOM S2S OAUTH API):`)
      const basicAuth = Buffer.from(`${acc.client_id}:${clientSecret}`).toString("base64")
      const tokenUrl = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${acc.account_id}`
      
      const tokenResp = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
        },
      })

      console.log(`Token Endpoint Status: ${tokenResp.status} ${tokenResp.statusText}`)
      const tokenJson = await tokenResp.json()

      if (!tokenResp.ok) {
        console.error(`[FAIL] Zoom OAuth Error:`, tokenJson)
        continue
      }

      console.log(`[PASS] Zoom Access Token acquired successfully!`)
      console.log(`- Token Type: ${tokenJson.token_type}`)
      console.log(`- Expires In: ${tokenJson.expires_in} seconds (~${Math.round(tokenJson.expires_in / 60)} minutes)`)
      console.log(`- Scopes: ${tokenJson.scope}`)

      const accessToken = tokenJson.access_token

      // 3. Zoom User /me Check
      console.log(`\n3. USER PROFILE VERIFICATION:`)
      const userResp = await fetch("https://api.zoom.us/v2/users/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      console.log(`User Info Endpoint Status: ${userResp.status}`)
      const userJson = await userResp.json()

      if (userResp.ok) {
        console.log(`[PASS] Zoom Account Owner:`, {
          id: userJson.id,
          email: userJson.email,
          type: userJson.type === 2 ? "Licensed / Pro (Supported for >40min)" : userJson.type === 1 ? "Basic (40min limit)" : userJson.type,
          status: userJson.status,
          displayName: `${userJson.first_name || ""} ${userJson.last_name || ""}`.trim(),
        })
      } else {
        console.warn(`[WARN] User /me responded with:`, userJson)
      }

      // 4. Test Create Meeting (Dry Run / Test Room)
      console.log(`\n4. MEETING CREATION TEST:`)
      const meetingPayload = {
        topic: "Solulu Verification Test Meeting",
        type: 2, // Scheduled meeting
        start_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        duration: 90,
        timezone: "Asia/Jakarta",
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: true,
          waiting_room: false,
          mute_upon_entry: false,
          auto_recording: "none",
        },
      }

      const createResp = await fetch("https://api.zoom.us/v2/users/me/meetings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(meetingPayload),
      })

      console.log(`Create Meeting Status: ${createResp.status} ${createResp.statusText}`)
      const createJson = await createResp.json()

      if (createResp.ok) {
        console.log(`[PASS] Zoom Meeting Created Successfully!`)
        console.log(`- Meeting ID: ${createJson.id}`)
        console.log(`- Join URL (Client/Guest): ${createJson.join_url}`)
        console.log(`- Start URL (Counselor Host): ${createJson.start_url ? createJson.start_url.substring(0, 45) + "..." : "N/A"}`)
        console.log(`- Password: ${createJson.password}`)

        // Clean up test meeting
        console.log(`\n5. CLEANUP: Deleting test meeting ${createJson.id}...`)
        const delResp = await fetch(`https://api.zoom.us/v2/meetings/${createJson.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        console.log(`Delete Status: ${delResp.status} ${delResp.statusText}`)
        if (delResp.ok || delResp.status === 204) {
          console.log(`[PASS] Test meeting deleted cleanly. No leftover test rooms.`)
        }
      } else {
        console.error(`[FAIL] Could not create meeting:`, createJson)
      }
    }
  } catch (err) {
    console.error("Fatal error:", err)
  } finally {
    await sql.end()
    console.log("\n=== VALIDATION SCRIPT FINISHED ===")
  }
}

run()
