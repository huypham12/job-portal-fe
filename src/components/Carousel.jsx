import { useEffect, useRef, useState } from 'react'

export default function Carousel({ images = [], auto = true, interval = 3500, className = '', effect = 'fade' /* 'fade' | 'slide' */ }){
  const [idx, setIdx] = useState(0)
  const timer = useRef(null)
  const count = images.length

  const go = (n) => setIdx((prev) => (n + count) % count)
  const next = () => go(idx + 1)
  const prev = () => go(idx - 1)

  useEffect(() => {
    if(!auto || count <= 1) return
    timer.current && clearInterval(timer.current)
    timer.current = setInterval(() => setIdx((i) => (i + 1) % count), interval)
    return () => timer.current && clearInterval(timer.current)
  }, [auto, interval, count])

  const onMouseEnter = () => { if(timer.current) { clearInterval(timer.current); timer.current = null } }
  const onMouseLeave = () => { if(auto && count>1) { timer.current = setInterval(() => setIdx((i)=>(i+1)%count), interval) } }

  const onKeyDown = (e) => {
    if(e.key === 'ArrowLeft') prev()
    if(e.key === 'ArrowRight') next()
  }

  if(count === 0) return null

  const isSlide = effect === 'slide'

  return (
    <div className={`carousel ${isSlide ? 'slide' : 'fade'} ${className}`} tabIndex={0} onKeyDown={onKeyDown} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      {isSlide ? (
        <div className="carousel-track" style={{ transform: `translateX(-${idx * 100}%)` }}>
          {images.map((src, i) => (
            <img key={i} src={src} alt={`Slide ${i+1}`} className="carousel-item" />
          ))}
        </div>
      ) : (
        images.map((src, i) => (
          <img key={i} src={src} alt={`Slide ${i+1}`} className={`carousel-img${i===idx?' active':''}`} />
        ))
      )}
      {count>1 && (
        <>
          <button aria-label="Previous" className="carousel-arrow left" onClick={prev}>‹</button>
          <button aria-label="Next" className="carousel-arrow right" onClick={next}>›</button>
          <div className="carousel-dots">
            {images.map((_, i)=>(
              <button key={i} aria-label={`Go to slide ${i+1}`} className={`carousel-dot${i===idx?' active':''}`} onClick={()=>go(i)} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
