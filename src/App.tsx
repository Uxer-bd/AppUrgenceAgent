import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonRouterOutlet,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import React from 'react';
import AgentDashboard from './pages/AgentDashboard0';
import ManagerDashboard from './pages/ManagerDashboard';
import LoginPage from './pages/Login';
import ManagerInterventionDetails from './pages/ManagerInterventionDetails';


/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';
import AgentCreationForm from './components/AgentCreationForm';
import AgentListPage from './pages/AgentListePage';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonTabs>
        <IonRouterOutlet>
          <Route exact path="/dashboard" component={AgentDashboard} />
          <Route exact path="/dashboard/manager" component={ManagerDashboard} />
          <Route exact path="/login" component={LoginPage} />
          <Route exact path="/manager/create-agent" component={AgentCreationForm} />
          <Route exact path="/manager/agent/liste/" component={AgentListPage} />
          <Route
            path="/manager/intervention/:id"
            exact={true}
            component={ManagerInterventionDetails}
          />
          <Route exact path="/">
            <Redirect to="/login" />
          </Route>
        </IonRouterOutlet>
      </IonTabs>
    </IonReactRouter>
  </IonApp>
);

export default App;
