'use client';

export default function Button({
  as = "button",
  variant = "primary",
  className = "",
  children,
  ...props
}) {
  const Component = as;
  const classes = `panel-button panel-button--${variant} ${className}`.trim();
  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
}
