import { useEffect } from 'react';

const VoiceflowChat = ({ onChatEnd }) => {
  useEffect(() => {
    // Generate or retrieve unique session ID for this instance
    const sessionID = localStorage.getItem('chatSessionID') || `${new Date().getTime()}-${Math.random()}`;
    localStorage.setItem('chatSessionID', sessionID);

    // Load Voiceflow widget with unique session ID
    const script = document.createElement('script');
    script.src = "https://cdn.voiceflow.com/widget/bundle.mjs";
    script.type = "text/javascript";
    script.onload = () => {
      const voiceflowChat = window.voiceflow.chat.load({
        verify: { projectID: "66cd6015e166995d728b65f7" },
        url: 'https://general-runtime.voiceflow.com',
        versionID: 'development',
        sessionID: sessionID,
        callbacks: {
          onEnd: () => {
            // Trigger the onChatEnd callback when the chat ends
            if (typeof onChatEnd === 'function') {
              onChatEnd();
            }
          },
        },
      });
    };
    document.body.appendChild(script);

    // Clean up the script when the component is unmounted
    return () => {
      document.body.removeChild(script);
    };
  }, [onChatEnd]);

  return null; // This component doesn't render anything visible
};

export default VoiceflowChat;
