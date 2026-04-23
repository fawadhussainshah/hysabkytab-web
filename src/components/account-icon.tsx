import { MaterialIcon } from "@/components/material-icon";

function isImageIcon(icon?: string) {
  if (!icon) return false;
  if (/^https?:\/\//i.test(icon)) return true;
  return /^data:image\//i.test(icon);
}

export function AccountIcon({
  icon,
  className = "",
  imageClassName = "",
}: {
  icon?: string;
  className?: string;
  imageClassName?: string;
}) {
  if (isImageIcon(icon)) {
    return <img src={icon} alt="" className={imageClassName} loading="lazy" />;
  }
  return <MaterialIcon name={icon || "account_balance"} className={className} />;
}
