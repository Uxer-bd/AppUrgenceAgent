import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonRouterOutlet,
  IonTabs,
  setupIonicReact,
  IonLoading
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import React, { useEffect, useState } from 'react';
import AgentDashboard from './pages/AgentDashboard0';
import ManagerDashboard from './pages/ManagerDashboard';
import LoginPage from './pages/Login';
import ManagerInterventionDetails from './pages/ManagerInterventionDetails';

/* Core & Basic CSS (omitted for brevity) */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import './theme/variables.css';

import AgentCreationForm from './components/AgentCreationForm';
import AgentListPage from './pages/AgentListePage';
import { getAuthSession } from './pages/AuthService';

setupIonicReact();

const App: React.FC = () => {

  const [session, setSession] = useState<{ token: string | null; role: string | null } | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      const data = await getAuthSession();
      setSession(data);
    };
    loadSession();
  }, []);

  if (session === null) {
    return <IonLoading isOpen={true} message="Initialisation..." />;
  }

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          {/* Route racine : Redirection intelligente */}
          <Route exact path="/">
            {!session.token ? <Redirect to="/login" /> : 
             session.role === 'manager' ? <Redirect to="/dashboard/manager" /> : <Redirect to="/dashboard" />}
          </Route>

          <Route exact path="/login">
            {session.token ? <Redirect to="/" /> : <LoginPage />}
          </Route>

          {/* On n'utilise IonTabs QUE si l'utilisateur est connecté pour éviter des bugs d'affichage au login */}
          {session.token ? (
            <IonTabs>
              <IonRouterOutlet>
                <Route exact path="/dashboard" component={AgentDashboard} />
                <Route exact path="/dashboard/manager" component={ManagerDashboard} />
                <Route exact path="/manager/create-agent" component={AgentCreationForm} />
                <Route exact path="/manager/agent/liste/" component={AgentListPage} />
                <Route path="/manager/intervention/:id" component={ManagerInterventionDetails} />
              </IonRouterOutlet>
              {/* Ajoutez votre IonTabBar ici si besoin */}
            </IonTabs>
          ) : (
            <Redirect to="/login" />
          )}
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
