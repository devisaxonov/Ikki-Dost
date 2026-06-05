import React, { useContext } from "react";
import "./FoodDisplay.css";
import { StoreContext } from "../../Context/store-context";
import FoodItem from "../FoodItem/FoodItem";
const FoodDisplay = ({ category }) => {
  const { food_list, foodsLoading } = useContext(StoreContext);

  return (
    <div className="food-display" id="food-display">
      <h2>Sizga mos eng sara taomlar</h2>
      {foodsLoading ? <p>Menyu yuklanmoqda...</p> : null}
      {!foodsLoading && food_list.length === 0 ? <p>Hozircha menyu mavjud emas.</p> : null}
      <div className="food-display-list">
        {food_list.map((item) => {
          if (category === "All" || category === item.category) {
            return (
              <FoodItem
                key={item._id}
                id={item._id}
                name={item.name}
                description={item.description}
                price={item.price}
                image={item.image}
              />
            ); 
          }

          return null;
        })}
      </div>
    </div>
  );
};

export default FoodDisplay;
