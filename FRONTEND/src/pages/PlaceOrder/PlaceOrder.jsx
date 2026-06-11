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
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const MAP_ZOOM = 15;
const DEFAULT_LOCATION = {
  lat: 41.3111,
  lng: 69.2797,
};

const markerIcon = new L.DivIcon({
  className: "custom-leaflet-marker",
  html: '<div class="place-order-map-marker-leaflet"></div>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

function MapController({ center, setFormData, setLocationMessage }) {
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      const location = { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
      setFormData((prev) => ({ ...prev, location }));
      setLocationMessage(
        `Lokatsiya tanlandi: ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
      );
    },
  });

  useEffect(() => {
    if (center) {
      map.flyTo(center, map.getZoom(), { duration: 1.5 });
    }
  }, [center, map]);

  return null;
}

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

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage("Brauzeringiz lokatsiya aniqlashni qo'llab-quvvatlamaydi.");
      return;
    }

    setLocationMessage("Lokatsiya aniqlanmoqda...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
        };
        setFormData((prev) => ({ ...prev, location }));
        setMapCenter(location);
        setLocationMessage(
          `Lokatsiya tanlandi: ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
        );
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
          <div className="place-order-map-container">
            <MapContainer
              center={[mapCenter.lat, mapCenter.lng]}
              zoom={MAP_ZOOM}
              scrollWheelZoom={true}
              className="place-order-map"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController 
                center={mapCenter} 
                setFormData={setFormData}
                setLocationMessage={setLocationMessage} 
              />
              {formData.location && (
                <Marker 
                  position={[formData.location.lat, formData.location.lng]}
                  icon={markerIcon}
                />
              )}
            </MapContainer>
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
