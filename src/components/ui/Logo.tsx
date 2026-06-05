import logo from '../../assets/preproute-logo.png'

export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={className}>
      <img
        src={logo}
        alt="PrepRoute Logo"
        className="h-8 w-auto"
      />
    </div>
  )
}
