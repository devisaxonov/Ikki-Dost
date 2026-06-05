import { useContext, useEffect, useState } from "react";
import "./PlaceOrder.css";
import { StoreContext } from "../../Context/store-context";
import { useNavigate } from "react-router-dom";
import {
  formatUzbekPhoneInput,
  isValidUzbekPhone,
  normalizeUzbekPhone,
  UZBEK_PHONE_MESSAGE,
} from "../../utils/uzbekPhone";
import { formatSom } from "../../utils/formatSom";

const MAP_ZOOM = 15;
const TILE_SIZE = 256;
const DEFAULT_LOCATION = {
  lat: 41.3111,
  lng: 69.2797,
};

const wrapTileX = (tileX, zoom) => {
  const tileCount = 2 ** zoom;

  return ((tileX % tileCount) + tileCount) % tileCount;
};

const latLngToPoint = ({ lat, lng }, zoom) => {
  const scale = TILE_SIZE * 2 ** zoom;
  const sinLat = Math.sin((lat * Math.PI) / 180);

  return {
    x: ((lng + 180) / 360) * scale,
    y:
      (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) *
      scale,
  };
};

const pointToLatLng = ({ x, y }, zoom) => {
  const scale = TILE_SIZE * 2 ** zoom;
  const lng = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(Math.sinh(n));

  return {
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
  };
};

const PlaceOrder = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    getTotalCartAmount,
    getDeliveryFee,
    placeOrder,
    orderLoading,
    user,
  } = useContext(StoreContext);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    street: "",
    city: "",
    phone: "",
    note: "",
    location: null,
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [locationMessage, setLocationMessage] = useState(
    "Xaritadan manzilingizni belgilang yoki hozirgi lokatsiyangizni tanlang.",
  );
  const [mapCenter, setMapCenter] = useState(DEFAULT_LOCATION);

  useEffect(() => {
    if (!user) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      phone: prev.phone || (user.phone ? formatUzbekPhoneInput(user.phone) : ""),
      firstName: prev.firstName || user.name?.split(" ")[0] || "",
      lastName: prev.lastName || user.name?.split(" ").slice(1).join(" ") || "",
    }));
  }, [user]);

  const itemCount = Object.values(cartItems).reduce(
    (sum, quantity) => sum + quantity,
    0,
  );

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    const nextValue =
      name === "phone" ? formatUzbekPhoneInput(value) : value;

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));
  };

  const selectLocation = (location) => {
    setFormData((prev) => ({
      ...prev,
      location,
    }));
    setMapCenter(location);
    setLocationMessage(
      `Lokatsiya tanlandi: ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`,
    );
  };

  const onMapClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerPoint = latLngToPoint(mapCenter, MAP_ZOOM);
    const nextPoint = {
      x: centerPoint.x + event.clientX - rect.left - rect.width / 2,
      y: centerPoint.y + event.clientY - rect.top - rect.height / 2,
    };

    selectLocation(pointToLatLng(nextPoint, MAP_ZOOM));
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage("Brauzeringiz lokatsiya aniqlashni qo'llab-quvvatlamaydi.");
      return;
    }

    setLocationMessage("Lokatsiya aniqlanmoqda...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        selectLocation({
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
        });
      },
      () => {
        setLocationMessage(
          "Lokatsiyani olib bo'lmadi. Iltimos, xaritadan qo'lda belgilang.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setStatusMessage("");

    if (!isValidUzbekPhone(formData.phone)) {
      setStatusMessage(UZBEK_PHONE_MESSAGE);
      return;
    }

    if (!formData.location) {
      setStatusMessage("Xaritadan lokatsiyani belgilang");
      return;
    }

    const payload = {
      ...formData,
      phone: normalizeUzbekPhone(formData.phone),
    };

    const result = await placeOrder(payload);

    if (!result.success) {
      setStatusMessage(result.message);
      return;
    }

    setStatusMessage(result.message);
    navigate(user ? "/buyurtmalarim" : "/");
  };

  const centerPoint = latLngToPoint(mapCenter, MAP_ZOOM);
  const centerTileX = Math.floor(centerPoint.x / TILE_SIZE);
  const centerTileY = Math.floor(centerPoint.y / TILE_SIZE);
  const mapTiles = [-2, -1, 0, 1, 2].flatMap((xOffset) =>
    [-2, -1, 0, 1, 2].map((yOffset) => {
      const tileX = centerTileX + xOffset;
      const tileY = centerTileY + yOffset;

      return {
        key: `${tileX}-${tileY}`,
        src: `https://tile.openstreetmap.org/${MAP_ZOOM}/${wrapTileX(tileX, MAP_ZOOM)}/${tileY}.png`,
        left: tileX * TILE_SIZE - centerPoint.x,
        top: tileY * TILE_SIZE - centerPoint.y,
      };
    }),
  );

  const markerPosition = formData.location
    ? {
        left: latLngToPoint(formData.location, MAP_ZOOM).x - centerPoint.x,
        top: latLngToPoint(formData.location, MAP_ZOOM).y - centerPoint.y,
      }
    : null;

  return (
    <form className="place-order" onSubmit={onSubmitHandler}>
      <div className="place-order-left">
        <p className="title">Yetkazib berish ma&apos;lumotlari</p>
        {statusMessage ? <p className="place-order-message">{statusMessage}</p> : null}
        <div className="multi-fields">
          <input
            name="firstName"
            value={formData.firstName}
            onChange={onChangeHandler}
            type="text"
            placeholder="Ism"
            required
          />
          <input
            name="lastName"
            value={formData.lastName}
            onChange={onChangeHandler}
            type="text"
            placeholder="Familiya"
            required
          />
        </div>
        <input
          name="city"
          value={formData.city}
          onChange={onChangeHandler}
          type="text"
          placeholder="Shahar"
          required
        />
        <input
          name="street"
          value={formData.street}
          onChange={onChangeHandler}
          type="text"
          placeholder="Ko'cha va uy manzili"
          required
        />
        <input
          name="phone"
          value={formData.phone}
          onChange={onChangeHandler}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="Telefon raqami (+998 90 123 45 67)"
          required
          maxLength={17}
        />
        <textarea
          name="note"
          value={formData.note}
          onChange={onChangeHandler}
          rows="3"
          placeholder="Izoh (masalan: domofon, qavat yoki mo'ljal)"
          maxLength={300}
        />
        <div className="place-order-map-section">
          <div className="place-order-map-head">
            <div>
              <h3>Lokatsiyani xaritada belgilang</h3>
              <p>{locationMessage}</p>
            </div>
            <button type="button" onClick={useCurrentLocation}>
              Mening lokatsiyam
            </button>
          </div>
          <div
            className="place-order-map"
            role="button"
            tabIndex={0}
            onClick={onMapClick}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                selectLocation(mapCenter);
              }
            }}
          >
            {mapTiles.map((tile) => (
              <img
                key={tile.key}
                src={tile.src}
                alt=""
                draggable="false"
                referrerPolicy="no-referrer"
                style={{
                  left: `calc(50% + ${tile.left}px)`,
                  top: `calc(50% + ${tile.top}px)`,
                }}
              />
            ))}
            {markerPosition ? (
              <span
                className="place-order-map-marker"
                style={{
                  left: `calc(50% + ${markerPosition.left}px)`,
                  top: `calc(50% + ${markerPosition.top}px)`,
                }}
              />
            ) : null}
            <span className="place-order-map-hint">
              Tanlash uchun xaritada bosing
            </span>
            <a
              className="place-order-map-credit"
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
              onClick={(event) => event.stopPropagation()}
            >
              OpenStreetMap
            </a>
          </div>
        </div>
      </div>
      <div className="place-order-right">
        <div className="cart-total">
          <h2>To&apos;lov xulosasi</h2>
          <p>{itemCount} ta mahsulot tanlandi</p>
          <div>
            <div className="cart-total-details">
              <p>Oraliq jami</p>
              <p>{formatSom(getTotalCartAmount())}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>Yetkazib berish</p>
              <p>{formatSom(getDeliveryFee())}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <b>Umumiy</b>
              <b>
                {formatSom(getTotalCartAmount() + getDeliveryFee())}
              </b>
            </div>
          </div>
          <button type="submit" disabled={orderLoading || itemCount === 0}>
            {orderLoading ? "Buyurtma yuborilmoqda..." : "Buyurtmani yuborish"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
