// components/ARIconButton.js
import React from 'react';
import './ARIconButton.css';

export default function ARIconButton({ onClick }) {
  return (
    <button className="ar-icon-button" onClick={onClick} title="View in 3D / AR">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="white"
        viewBox="0 0 24 24"
        width="22"
        height="22"
      >
        <path d="M12 2L4 6v12l8 4 8-4V6l-8-4zm0 2.18L17.09 6 12 8.82 6.91 6 12 4.18zM6 8.1l5 2.73v6.97l-5-2.5V8.1zm7 9.7v-6.97l5-2.73v7.2l-5 2.5z" />
      </svg>
    </button>
  );
}
