import React from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import './Contact.css';

const Contact = () => {
  return (
    <div className="contact-container">
      <div className="contact-header">
        <h1>Contact Us</h1>
        <p>Get in touch with us for any questions or support</p>
      </div>

      <div className="contact-content">
        <div className="contact-info">
          <div className="info-item">
            <Mail className="info-icon" />
            <div>
              <h3>Email</h3>
              <p>support@careerflow.ai</p>
            </div>
          </div>
          <div className="info-item">
            <Phone className="info-icon" />
            <div>
              <h3>Phone</h3>
              <p>+1 (555) 123-4567</p>
            </div>
          </div>
          <div className="info-item">
            <MapPin className="info-icon" />
            <div>
              <h3>Address</h3>
              <p>123 Career Street, Tech City, TC 12345</p>
            </div>
          </div>
        </div>

        <form className="contact-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input type="text" id="name" placeholder="Your name" />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" placeholder="Your email" />
          </div>
          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea id="message" placeholder="Your message" rows="5"></textarea>
          </div>
          <button type="submit" className="submit-button">
            <Send className="button-icon" />
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contact; 