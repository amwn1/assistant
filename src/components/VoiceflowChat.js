import { useEffect } from 'react';

const VoiceflowChat = () => {
  useEffect(() => {
    // Check if the script has already been added to avoid duplicate loading
    if (!document.getElementById('voiceflow-widget')) {
      const script = document.createElement('script');
      script.id = 'voiceflow-widget'; // Add an ID to track the script
      script.src = "https://cdn.voiceflow.com/widget/bundle.mjs";
      script.type = "text/javascript";
      script.onload = () => {
        if (!window.voiceflowWidgetInitialized) {
          window.voiceflowWidgetInitialized = true;
          const rootElement = document.getElementById('voiceflow-root');
          if (rootElement) {
            // Use ReactDOMClient.createRoot only once
            if (!window.voiceflowRoot) {
              window.voiceflowRoot = ReactDOM.createRoot(rootElement);
            }
            // Use root.render() to update the element instead of creating it again
            window.voiceflowRoot.render(
              window.voiceflow.chat.load({
                verify: { projectID: "66cd6015e166995d728b65f7" },
                url: 'https://general-runtime.voiceflow.com',
                versionID: 'development'
              })
            );
          }
        }
      };
      document.body.appendChild(script);
    }

    // Clean up the script when the component is unmounted
    return () => {
      if (document.getElementById('voiceflow-widget')) {
        document.body.removeChild(document.getElementById('voiceflow-widget'));
      }
    };
  }, []);

  return <div id="voiceflow-root"></div>; // Add a root div to ensure proper rendering
};

export default VoiceflowChat;
