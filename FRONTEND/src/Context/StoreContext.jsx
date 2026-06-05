import { useCallback, useEffect, useState } from "react";
import { StoreContext } from "./store-context";
const getStoredCart = () => {
  try {
    const parsedCart = JSON.parse(localStorage.getItem("cartItems") ?? "{}");

    return Object.entries(parsedCart).reduce((acc, [key, value]) => {
      const numericValue = Number(value);

      if (numericValue > 0) {
        acc[key] = numericValue;
      }

      return acc;
    }, {});
  } catch {
    return {};
  }
};

const parseResponse = async (response) => {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
};

function StoreContextProvider({ children }) {
  const apiUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  const [foodList, setFoodList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [foodsLoading, setFoodsLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [cartItems, setCartItems] = useState(getStoredCart);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [token, setToken] = useState(localStorage.getItem("token") ?? "");
  const [user, setUser] = useState(null);

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${apiUrl}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
    });

    const result = await parseResponse(response);

    if (!response.ok || result.success === false) {
      throw new Error(result.message || "So'rov bajarilmadi");
    }

    return result;
  }, [apiUrl]);

  const normalizeFoods = useCallback((foods) =>
    foods.map((food) => ({
      ...food,
      _id: food.id,
      image: food.image?.startsWith("http")
        ? food.image
        : `${apiUrl}/uploads/${food.image}`,
    })), [apiUrl]);

  const normalizeCategories = useCallback(
    (categoryItems) =>
      categoryItems.map((categoryItem) => ({
        ...categoryItem,
        image: categoryItem.image
          ? categoryItem.image.startsWith("http")
            ? categoryItem.image
            : `${apiUrl}/uploads/${categoryItem.image}`
          : "",
      })),
    [apiUrl],
  );

  const fetchFoods = useCallback(async () => {
    setFoodsLoading(true);

    try {
      const result = await request("/foods", { method: "GET" });
      const foods = Array.isArray(result.data) ? result.data : [];
      setFoodList(normalizeFoods(foods));
    } catch (error) {
      console.error("Failed to fetch foods", error);
      setFoodList([]);
    } finally {
      setFoodsLoading(false);
    }
  }, [normalizeFoods, request]);

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);

    try {
      const result = await request("/categories", { method: "GET" });
      const categoryItems = Array.isArray(result.data) ? result.data : [];
      setCategories(normalizeCategories(categoryItems));
    } catch (error) {
      console.error("Failed to fetch categories", error);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, [normalizeCategories, request]);

  const fetchDeliveryFee = useCallback(async () => {
    try {
      const result = await request("/settings/delivery-fee", { method: "GET" });
      setDeliveryFee(result.data?.deliveryFee ?? 0);
    } catch (error) {
      console.error("Failed to fetch delivery fee", error);
    }
  }, [request]);

  const fetchProfile = useCallback(async (activeToken) => {
    if (!activeToken) {
      setUser(null);
      return;
    }

    try {
      const result = await request("/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });

      setUser(result.data ?? null);
    } catch (error) {
      console.error("Failed to fetch profile", error);
      setToken("");
      setUser(null);
    }
  }, [request]);

  const authenticate = async (path, payload) => {
    setAuthLoading(true);

    try {
      const result = await request(path, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setToken(result.data?.token ?? "");
      setUser(result.data?.user ?? null);

      return {
        success: true,
        message: result.message ?? "Muvaffaqiyatli bajarildi",
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Autentifikatsiyada xatolik yuz berdi",
      };
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async (payload) => authenticate("/auth/register", payload);

  const login = async (payload) => authenticate("/auth/login", payload);

  const logout = () => {
    setToken("");
    setUser(null);
  };

  const updateProfile = async (payload) => {
    if (!token) {
      return {
        success: false,
        message: "Profilni yangilash uchun avval tizimga kiring",
      };
    }

    setProfileLoading(true);

    try {
      const result = await request("/auth/me", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      setToken(result.data?.token ?? "");
      setUser(result.data?.user ?? null);

      return {
        success: true,
        message: result.message ?? "Profil ma'lumotlari yangilandi",
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Profilni yangilab bo'lmadi",
      };
    } finally {
      setProfileLoading(false);
    }
  };

  const getMyOrders = async () => {
    if (!token) {
      return {
        success: false,
        message: "Buyurtmalarni ko'rish uchun tizimga kiring",
        data: [],
      };
    }

    try {
      const result = await request("/orders/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return {
        success: true,
        data: Array.isArray(result.data) ? result.data : [],
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Buyurtmalarni yuklab bo'lmadi",
        data: [],
      };
    }
  };

  const addToCart = (itemId) => {
    setCartItems((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));
  };

  const removeFromCart = (itemId) => {
    setCartItems((prev) => {
      const nextCart = { ...prev };
      const nextValue = Math.max((nextCart[itemId] || 0) - 1, 0);

      if (nextValue === 0) {
        delete nextCart[itemId];
      } else {
        nextCart[itemId] = nextValue;
      }

      return nextCart;
    });
  };

  const clearCart = () => {
    setCartItems({});
  };

  const getTotalCartAmount = () =>
    Object.entries(cartItems).reduce((sum, [itemId, quantity]) => {
      const itemInfo = foodList.find((food) => String(food._id) === String(itemId));

      if (!itemInfo) {
        return sum;
      }

      return sum + itemInfo.price * quantity;
    }, 0);

  const getDeliveryFee = () => (getTotalCartAmount() === 0 ? 0 : deliveryFee);

  const isLegacyAddressValidationError = (message = "") =>
    message.includes("address.property location should not exist") ||
    message.includes("address.email must be an email") ||
    message.includes("address.state should not be empty") ||
    message.includes("address.zipCode should not be empty") ||
    message.includes("address.country should not be empty");

  const buildLegacyAddress = (address) => {
    const location = address.location;
    const hasLocation =
      location &&
      Number.isFinite(Number(location.lat)) &&
      Number.isFinite(Number(location.lng));
    const phoneDigits = String(address.phone || "").replace(/\D/g, "");
    const fallbackEmail = phoneDigits
      ? `guest-${phoneDigits}@ikkidost.local`
      : `guest-${Date.now()}@ikkidost.local`;
    const note = String(address.note || "").trim().slice(0, 60);
    const noteSuffix = note ? ` | Izoh: ${note}` : "";
    const locationSuffix = hasLocation
      ? ` | Lokatsiya: ${location.lat}, ${location.lng}`
      : "";
    const suffix = `${noteSuffix}${locationSuffix}`;
    const safeStreet = String(address.street || "").slice(
      0,
      Math.max(0, 150 - suffix.length),
    );

    return {
      firstName: address.firstName,
      lastName: address.lastName,
      email: address.email || user?.email || fallbackEmail,
      street: `${safeStreet}${suffix}`,
      city: address.city,
      state: address.state || address.city || "Toshkent",
      zipCode: address.zipCode || "100000",
      country: address.country || "Uzbekistan",
      phone: address.phone,
    };
  };

  const placeOrder = async (address) => {
    const items = Object.entries(cartItems)
      .filter(([, quantity]) => quantity > 0)
      .map(([foodId, quantity]) => ({
        foodId,
        quantity,
      }));

    if (items.length === 0) {
      return {
        success: false,
        message: "Savatchangiz bo'sh",
      };
    }

    setOrderLoading(true);

    try {
      const requestOrder = (nextAddress) => request("/orders", {
        method: "POST",
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
        body: JSON.stringify({
          items,
          address: nextAddress,
        }),
      });

      let result;

      try {
        result = await requestOrder(address);
      } catch (error) {
        if (!isLegacyAddressValidationError(error.message)) {
          throw error;
        }

        result = await requestOrder(buildLegacyAddress(address));
      }

      clearCart();

      return {
        success: true,
        message: result.message ?? "Buyurtma muvaffaqiyatli yuborildi",
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Buyurtmani yuborib bo'lmadi",
      };
    } finally {
      setOrderLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchDeliveryFee();
  }, [fetchDeliveryFee]);

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      fetchProfile(token);
      return;
    }

    localStorage.removeItem("token");
    setUser(null);
  }, [fetchProfile, token]);

  const contextValue = {
    apiUrl,
    food_list: foodList,
    categories,
    foodsLoading,
    categoriesLoading,
    authLoading,
    orderLoading,
    profileLoading,
    cartItems,
    user,
    token,
    addToCart,
    removeFromCart,
    clearCart,
    logout,
    login,
    register,
    updateProfile,
    getMyOrders,
    setCartItems,
    getTotalCartAmount,
    getDeliveryFee,
    placeOrder,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {children}
    </StoreContext.Provider>
  );
}

export default StoreContextProvider;
