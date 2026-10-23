import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  House,
  MapPin,
  Phone,
  Mail,
  ArrowUpRight,
  Heart,
} from "lucide-react";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="tn-footer">
      <div className="tn-footer-container">
        {/* Brand and description */}
        <div className="tn-footer-brand">
          <Link to="/" className="tn-footer-logo">
            <span className="tn-footer-logo-icon">
              <House size={25} strokeWidth={2.2} />
            </span>
            <span>
              <strong>TURAHEZA</strong>
              <strong>NAWE</strong>
            </span>
          </Link>

          <p className="tn-footer-description">
            {t("footer.description")}
          </p>

          <p className="tn-footer-tagline">
            {t("footer.tagline")}
          </p>
        </div>

        {/* Explore links */}
        <div className="tn-footer-column">
          <h3>{t("footer.exploreTitle")}</h3>
          <ul>
            <li>
              <Link to="/">{t("footer.home")}</Link>
            </li>
            <li>
              <Link to="/properties">{t("footer.properties")}</Link>
            </li>
            <li>
              <Link to="/search">{t("footer.searchProperties")}</Link>
            </li>
          </ul>
        </div>

        {/* Company links */}
        <div className="tn-footer-column">
          <h3>{t("footer.companyTitle")}</h3>
          <ul>
            <li>
              <Link to="/about">{t("footer.about")}</Link>
            </li>
            <li>
              <Link to="/contact">{t("footer.contact")}</Link>
            </li>
            <li>
              <Link to="/register?role=owner">
                {t("footer.listProperty")}
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact details */}
        <div className="tn-footer-column tn-footer-contact">
          <h3>{t("footer.contactTitle")}</h3>

          <a href="tel:0796189550" className="tn-footer-contact-item">
            <Phone size={17} />
            <span>0796189550</span>
          </a>

          <a
            href="mailto:turahezanawe@gmail.com"
            className="tn-footer-contact-item"
          >
            <Mail size={17} />
            <span>turahezanawe@gmail.com</span>
          </a>

          <div className="tn-footer-contact-item">
            <MapPin size={17} />
            <span>{t("footer.locations")}</span>
          </div>

          <a
            href="https://wa.me/250796189550"
            target="_blank"
            rel="noopener noreferrer"
            className="tn-footer-whatsapp"
          >
            {t("footer.chatWithUs")}
            <ArrowUpRight size={16} />
          </a>
        </div>
      </div>

      {/* Bottom section */}
      <div className="tn-footer-bottom">
        <p>
          © {new Date().getFullYear()} TURAHEZA NAWE.{" "}
          {t("footer.rights")}
        </p>

        <p className="tn-footer-made">
          {t("footer.madeWith")} <Heart size={14} fill="currentColor" />{" "}
          {t("footer.inRwanda")}
        </p>
      </div>
    </footer>
  );
}