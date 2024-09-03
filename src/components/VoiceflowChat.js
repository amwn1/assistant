import { useEffect } from 'react';

const VoiceflowChat = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdn.voiceflow.com/widget/bundle.mjs";
    script.type = "text/javascript";
    script.onload = () => {
      window.voiceflow.chat.load({
        verify: { projectID: process.env.VOICEFLOW_VERSION_ID },
        url: 'https://general-runtime.voiceflow.com',
        versionID: 'development'
        // render: {
        //   mode: 'embedded',
        //   // target: document.getElementById('flat-chat'),
        //   target: document.body,
        // },
        // autostart: false
      });
    };
    document.body.appendChild(script);

    // Clean up the script when the component is unmounted
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null; // This component doesn't render anything visible
};

export default VoiceflowChat;