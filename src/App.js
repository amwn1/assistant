import React from 'react';
// import VfNameGenerator from './components/VfNameGenerator.js'; // Make sure the path is correct
import VoiceflowChat from './components/VoiceflowChat.js'
import NameGenPusher from './components/namegenpusher.js';
import TestGoogleLink from './components/testGoogleLink.js';


function App() {
  return (
    <div id="flat-chat" className="App">
      {/* <VfNameGenerator /> */}
      <TestGoogleLink />
      <NameGenPusher/>
      <VoiceflowChat />
    </div>
  );
}

export default App;
