import React, { useContext, useMemo } from 'react'
import './ExploreMenu.css'
import { menu_list } from '../../assets/frontend_assets/assets'
import { StoreContext } from '../../Context/store-context'

const normalizeCategoryKey = (value = '') =>
  value.toLowerCase().replace(/['`’]/g, '').replace(/\s+/g, '')

const ExploreMenu = ({ category, setCategory }) => {
  const { categories, categoriesLoading, food_list } = useContext(StoreContext)

  const menuImageMap = useMemo(
    () =>
      menu_list.reduce((acc, item) => {
        acc[normalizeCategoryKey(item.menu_name)] = item
        acc[normalizeCategoryKey(item.menu_label)] = item
        return acc
      }, {}),
    [],
  )

  const dynamicCategories = useMemo(() => {
    if (categories.length > 0) {
      return categories.map((item, index) => {
        const knownCategory = menuImageMap[normalizeCategoryKey(item.name)]

        return {
          id: item.id ?? `${item.name}-${index}`,
          name: item.name,
          label: knownCategory?.menu_label ?? item.name,
          image: item.image || knownCategory?.menu_image || '',
        }
      })
    }

    return [...new Set(food_list.map((item) => item.category).filter(Boolean))].map(
      (item, index) => {
        const knownCategory = menuImageMap[normalizeCategoryKey(item)]

        return {
          id: `${item}-${index}`,
          name: item,
          label: knownCategory?.menu_label ?? item,
          image: knownCategory?.menu_image || '',
        }
      },
    )
  }, [categories, food_list, menuImageMap])

  return (
    <div className='explore-menu' id='explore-menu'>
      <h1>Bizning menyuni ko&apos;rib chiqing</h1>
      <p className='explore-menu-text'>
        Ta&apos;bingizga mos bo&apos;lgan bo&apos;limni tanlang va kerakli taomni
        tez toping.
      </p>

      <div className='explore-menu-list'>
        <button
          type='button'
          className='explore-menu-list-item'
          onClick={() => setCategory('All')}
        >
          <div
            className={`explore-menu-list-item-media ${category === 'All' ? 'active' : ''}`}
          >
            <span className='explore-menu-list-item-fallback'>B</span>
          </div>
          <p>Barchasi</p>
        </button>

        {dynamicCategories.map((item) => (
          <button
            type='button'
            className='explore-menu-list-item'
            onClick={() =>
              setCategory((prevCategory) =>
                prevCategory === item.name ? 'All' : item.name,
              )
            }
            key={item.id}
          >
            <div
              className={`explore-menu-list-item-media ${category === item.name ? 'active' : ''}`}
            >
              {item.image ? (
                <img src={item.image} alt={item.label} />
              ) : (
                <span className='explore-menu-list-item-fallback'>
                  {item.label.slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>
            <p>{item.label}</p>
          </button>
        ))}
      </div>

      {categoriesLoading ? (
        <p className='explore-menu-status'>Kategoriyalar yangilanmoqda...</p>
      ) : null}

      <hr />
    </div>
  )
}

export default ExploreMenu
