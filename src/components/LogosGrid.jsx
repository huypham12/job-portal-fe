export default function LogosGrid({items}){
  return (
    <div className="logos">
      {items.map(l => <div key={l} className="logo">{l}</div>)}
    </div>
  )
}

