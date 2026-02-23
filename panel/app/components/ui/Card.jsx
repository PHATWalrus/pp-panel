'use client';

export default function Card({ strong = false, className = "", style, children, ...props }) {
  const classes = `panel-card${strong ? " panel-card--strong" : ""} ${className}`.trim();
  return (
    <section className={classes} style={style} {...props}>
      {children}
    </section>
  );
}
