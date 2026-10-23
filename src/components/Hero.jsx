
import {
  Search,
  MapPin,
  Home,
  Building2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

function Hero() {
  const { t } = useTranslation();

  const handleSearch = (e) => {
    e.preventDefault();

    const form = new FormData(e.currentTarget);
    const location = form.get("location")?.trim() || "";
    const type = form.get("type") || "";
    const listing = form.get("listing") || "";

    const params = new URLSearchParams();

    if (location) params.set("location", location);
    if (type) params.set("type", type);
    if (listing) params.set("listing", listing);

    window.location.href = `/properties?${params.toString()}`;
  };

  return (
    <section
      className="hero"
      style={{
        backgroundImage: `
          linear-gradient(
            90deg,
            rgba(9, 30, 25, 0.88) 0%,
            rgba(9, 30, 25, 0.66) 48%,
            rgba(9, 30, 25, 0.22) 100%
          ),
          url("https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=2000&q=90")
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="hero-overlay"></div>

      <div className="hero-content">
        <div className="hero-badge">
          <MapPin size={16} />
          <span>{t("hero.badge")}</span>
        </div>

        <h1>
          {t("hero.title")}
          <span> {t("hero.titleHighlight")}</span>
        </h1>

        <p>{t("hero.description")}</p>

        <form className="property-search" onSubmit={handleSearch}>
          <div className="search-field">
            <MapPin size={20} />

            <div>
              <label htmlFor="hero-location">
                {t("hero.location")}
              </label>
              <input
                id="hero-location"
                name="location"
                type="text"
                placeholder={t("hero.locationPlaceholder")}
              />
            </div>
          </div>

          <div className="search-field">
            <Home size={20} />

            <div>
              <label htmlFor="hero-type">
                {t("hero.propertyType")}
              </label>
              <select id="hero-type" name="type" defaultValue="">
                <option value="">{t("hero.allProperties")}</option>
                <option value="house">{t("propertyTypes.house")}</option>
                <option value="apartment">{t("propertyTypes.apartment")}</option>
                <option value="room">{t("propertyTypes.room")}</option>
                <option value="villa">{t("propertyTypes.villa")}</option>
                <option value="land">{t("propertyTypes.land")}</option>
                <option value="shop">{t("propertyTypes.shop")}</option>
                <option value="office">{t("propertyTypes.office")}</option>
                <option value="commercial">
                  {t("propertyTypes.commercial")}
                </option>
              </select>
            </div>
          </div>

          <div className="search-field">
            <Building2 size={20} />

            <div>
              <label htmlFor="hero-listing">
                {t("hero.lookingFor")}
              </label>
              <select
                id="hero-listing"
                name="listing"
                defaultValue=""
              >
                <option value="">{t("hero.rentOrBuy")}</option>
                <option value="rent">{t("hero.forRent")}</option>
                <option value="sale">{t("hero.forSale")}</option>
              </select>
            </div>
          </div>

          <button className="search-button" type="submit">
            <Search size={20} />
            <span>{t("search")}</span>
          </button>
        </form>

        <div className="hero-links">
          <span>{t("hero.popular")}:</span>
          <a href="/properties?location=Gisenyi">
            {t("locations.gisenyi")}
          </a>
          <a href="/properties?location=Kigali">
            {t("locations.kigali")}
          </a>
          <a href="/properties?location=Rubavu">
            {t("locations.rubavu")}
          </a>
          <a href="/properties?type=land">
            {t("propertyTypes.land")}
          </a>
        </div>
      </div>
    </section>
  );
}

export default Hero;
