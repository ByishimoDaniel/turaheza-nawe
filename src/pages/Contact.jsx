
import { useTranslation } from "react-i18next";

import {
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  ExternalLink,
  Clock,
} from "lucide-react";

const offices = [
  {
    city: "Rubavu",
    descriptionKey: "contact.offices.rubavu",
    map: "https://www.google.com/maps/search/?api=1&query=Rubavu%2C+Rwanda",
  },
  {
    city: "Musanze",
    descriptionKey: "contact.offices.musanze",
    map: "https://www.google.com/maps/search/?api=1&query=Musanze%2C+Rwanda",
  },
  {
    city: "Kigali",
    descriptionKey: "contact.offices.kigali",
    map: "https://www.google.com/maps/search/?api=1&query=Kigali%2C+Rwanda",
  },
];

const contacts = [
  {
    name: "Daniel Byishimo",
    positionKey: "contact.positions.ceo",
    phone: "0796189550",
    email: "danielbyishimo340@gmail.com",
  },
  {
    name: "Shema Frank",
    positionKey: "contact.positions.director",
    phone: "0789548261",
    email: "shemafrank20@gmail.com",
  },
  {
    name: "Mushimiyimana Mussa",
    positionKey: "contact.positions.itManager",
    phone: "0788468233",
    email: "mmussa2510@gmail.com",
  },
  {
    name: "Maniraguha Ettiene",
    positionKey: "contact.positions.engineer",
    phone: "0786200854",
    email: "metienne1017@gmail.com",
  },
];

function whatsappLink(phone, message) {
  const internationalPhone = `250${phone.replace(/^0/, "")}`;
  return `https://wa.me/${internationalPhone}?text=${encodeURIComponent(message)}`;
}

export default function Contact() {
  const { t } = useTranslation();

  const whatsappMessage = t("contact.whatsappMessage");
  const quickWhatsappMessage = t("contact.quickWhatsappMessage");

  return (
    <main className="tn-contact-page">
      <section className="tn-contact-hero">
        <span className="tn-contact-eyebrow">
          {t("contact.eyebrow")}
        </span>

        <h1>{t("contact.title")}</h1>

        <p>{t("contact.description")}</p>
      </section>

      <section className="tn-contact-quick-grid">
        <a
          className="tn-contact-quick-card"
          href={`https://wa.me/250796189550?text=${encodeURIComponent(
            quickWhatsappMessage
          )}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="tn-contact-icon">
            <MessageCircle size={24} />
          </span>

          <span>
            <strong>{t("contact.whatsapp")}</strong>
            <small>{t("contact.chatWithCeo")}</small>
          </span>

          <ExternalLink size={17} />
        </a>

        <a className="tn-contact-quick-card" href="tel:0796189550">
          <span className="tn-contact-icon">
            <Phone size={24} />
          </span>

          <span>
            <strong>{t("contact.callUs")}</strong>
            <small>0796189550</small>
          </span>

          <ExternalLink size={17} />
        </a>

        <a
          className="tn-contact-quick-card"
          href="mailto:turahezanawe@gmail.com"
        >
          <span className="tn-contact-icon">
            <Mail size={24} />
          </span>

          <span>
            <strong>{t("contact.emailUs")}</strong>
            <small>turahezanawe@gmail.com</small>
          </span>

          <ExternalLink size={17} />
        </a>
      </section>

      <section className="tn-contact-main">
        <div className="tn-contact-offices">
          <span className="tn-contact-eyebrow">
            {t("contact.locationsEyebrow")}
          </span>

          <h2>{t("contact.locationsTitle")}</h2>

          <p>{t("contact.locationsDescription")}</p>

          <div className="tn-office-list">
            {offices.map((office) => (
              <a
                href={office.map}
                target="_blank"
                rel="noopener noreferrer"
                className="tn-office-card"
                key={office.city}
              >
                <span className="tn-contact-icon">
                  <MapPin size={22} />
                </span>

                <span className="tn-office-info">
                  <strong>{office.city}</strong>
                  <small>{t(office.descriptionKey)}</small>
                </span>

                <ExternalLink size={17} />
              </a>
            ))}
          </div>

          <div className="tn-contact-hours">
            <Clock size={20} />

            <div>
              <strong>{t("contact.availabilityTitle")}</strong>
              <p>{t("contact.availabilityDescription")}</p>
            </div>
          </div>
        </div>

        <div className="tn-contact-team">
          <span className="tn-contact-eyebrow">
            {t("contact.teamEyebrow")}
          </span>

          <h2>{t("contact.teamTitle")}</h2>

          {contacts.map((person) => (
            <article
              className="tn-contact-person"
              key={person.email}
            >
              <div className="tn-contact-person-heading">
                <div className="tn-contact-person-avatar">
                  {person.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </div>

                <div>
                  <strong>{person.name}</strong>
                  <small>{t(person.positionKey)}</small>
                </div>
              </div>

              <div className="tn-contact-person-actions">
                <a href={`tel:${person.phone}`}>
                  <Phone size={15} /> {t("contact.call")}
                </a>

                <a href={`mailto:${person.email}`}>
                  <Mail size={15} /> {t("contact.email")}
                </a>

                <a
                  href={whatsappLink(person.phone, whatsappMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle size={15} /> {t("contact.whatsapp")}
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
