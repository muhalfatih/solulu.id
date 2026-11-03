import type { VariantProps } from "class-variance-authority"
import type { buttonVariants } from "@/components/ui/button"

type RegistryButtonVariants = VariantProps<typeof buttonVariants>
type RegistryVariant = NonNullable<RegistryButtonVariants["variant"]>
type RegistrySize = NonNullable<RegistryButtonVariants["size"]>

/**
 * Public-site button looks, expressed as `className` layered on top of the
 * registry `Button` (ADR-0012). The hex accents below are the brand purple,
 * identical in light and dark; surface colors come from `.theme-public` tokens.
 */
const PUBLIC_VARIANT_CLASSES = {
  public:
    "bg-[#7c3aed] text-white hover:bg-[#6d28d9] shadow-sm shadow-[#7c3aed]/20 active:scale-[0.98] font-semibold transition-all",
  "public-secondary":
    "border border-border/80 bg-background text-foreground hover:bg-secondary hover:text-[#7c3aed] hover:border-purple-300/60 dark:hover:border-purple-800/60 shadow-2xs active:scale-[0.98] font-semibold transition-all",
  "public-white":
    "bg-white text-purple-950 hover:bg-purple-50 shadow-sm active:scale-[0.98] font-semibold transition-all",
} as const

const PUBLIC_SIZE_CLASSES = {
  pill: "h-11 gap-2 px-6 text-sm font-semibold rounded-full has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
  "pill-lg":
    "h-12 gap-2.5 px-7 text-sm font-semibold rounded-full has-data-[icon=inline-end]:pr-6 has-data-[icon=inline-start]:pl-6",
  "pill-sm":
    "h-9 gap-1.5 px-4 text-xs font-semibold rounded-full has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5",
} as const

export type PublicButtonVariant =
  | keyof typeof PUBLIC_VARIANT_CLASSES
  | RegistryVariant
export type PublicButtonSize = keyof typeof PUBLIC_SIZE_CLASSES | RegistrySize

function isPublicVariant(
  variant: PublicButtonVariant
): variant is keyof typeof PUBLIC_VARIANT_CLASSES {
  return variant in PUBLIC_VARIANT_CLASSES
}

function isPublicSize(
  size: PublicButtonSize
): size is keyof typeof PUBLIC_SIZE_CLASSES {
  return size in PUBLIC_SIZE_CLASSES
}

export interface ResolvedPublicButton {
  variant: RegistryVariant
  size: RegistrySize
  /** Classes layered on the registry button to reproduce the public look. */
  className: string
}

/**
 * Maps a public variant/size pair onto registry `Button` props plus the
 * className that reproduces the public look. Registry variants and sizes pass
 * through untouched.
 */
export function resolvePublicButton(
  variant: PublicButtonVariant = "default",
  size: PublicButtonSize = "default"
): ResolvedPublicButton {
  const classes: string[] = []
  let registryVariant: RegistryVariant
  let registrySize: RegistrySize

  if (isPublicVariant(variant)) {
    registryVariant = "default"
    classes.push(PUBLIC_VARIANT_CLASSES[variant])
  } else {
    registryVariant = variant
  }

  if (isPublicSize(size)) {
    // "lg" carries no button-group radius rule, so the pill override is exact.
    registrySize = "lg"
    classes.push(PUBLIC_SIZE_CLASSES[size])
  } else {
    registrySize = size
  }

  return {
    variant: registryVariant,
    size: registrySize,
    className: classes.join(" "),
  }
}
