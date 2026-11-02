import React, { useState } from 'react';
import messengerLogo from '../assets/images/logomess.png';

const MessengerButton = () => {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = () => {
    // Open Messenger / Support link in new tab or popup
    window.open('https://m.me', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed bottom-24 right-5 sm:bottom-6 sm:right-6 z-40 flex items-center">
      {/* Tooltip */}
      {showTooltip && (
        <div className="hidden sm:block mr-3 bg-zinc-900 text-white text-xs px-3 py-1.5 rounded-xl border border-zinc-700 shadow-xl animate-in fade-in slide-in-from-right-2 duration-150 select-none">
          Hỗ trợ trực tuyến
        </div>
      )}

      {/* Floating Messenger Button */}
      <button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        type="button"
        className="w-12 h-12 rounded-full overflow-hidden shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer border-2 border-white/20 bg-zinc-900 flex items-center justify-center p-0.5"
        title="Chat với Akashi Cinema qua Messenger"
        aria-label="Chat với Akashi Cinema"
      >
        <img
          src={messengerLogo}
          alt="Messenger"
          className="w-full h-full object-cover"
        />
      </button>
    </div>
  );
};

export default MessengerButton;

