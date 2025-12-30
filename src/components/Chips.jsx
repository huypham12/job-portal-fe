export default function Chips({items, onPick}){
  return (
    <div className="chip-row">
      {items.map(c => (
        <button key={c} className="chip" onClick={() => onPick?.(c)}>{c}</button>
      ))}
    </div>
  )
}

