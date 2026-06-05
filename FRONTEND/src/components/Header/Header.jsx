import './Header.css'

const Header = () => {
  const scrollToMenu = () => {
    document.getElementById('explore-menu')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <div className='header'>
          <div className="header-contents">
              <h2>Sevimli taomingizni shu yerdan buyurtma qiling</h2>
              <p>
                Eng sara ingredientlar bilan tayyorlangan mazali taomlarni tanlang.
                Bizning maqsadimiz har bir buyurtmada sizga tezkor xizmat va yoqimli ta&apos;m ulashishdir.
              </p>
              <button type="button" onClick={scrollToMenu}>Menyuni ko&apos;rish</button>
          </div>
    </div>
  )
}

export default Header
