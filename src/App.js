import React, { useEffect } from 'react';
import { auth, db } from './common/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useSetAtom, useAtomValue } from 'jotai';
import {
  isWelcomeAtom,
  authUserAtom,
  isSpAtom,
  isTabletAtom,
} from './state/atoms';
import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom';
import Editor from './components/Editor/Editor';
import Main from './components/Main/Main';
import UserSetting from './components/Detail/UserSetting';
import 'moment/locale/ja';
import moment from 'moment';
import { mediaQuery, useMediaQuery } from './common/responsive';

const App = () => {
  moment.locale('ja');
  const isSp = useMediaQuery(mediaQuery.sp);
  const isTablet = useMediaQuery(mediaQuery.tablet);

  const setAuthUser = useSetAtom(authUserAtom);
  const isWelcome = useAtomValue(isWelcomeAtom);
  const setIsSp = useSetAtom(isSpAtom);
  const setIsTablet = useSetAtom(isTabletAtom);

  useEffect(() => {
    const unSub = auth.onAuthStateChanged(async firebaseUser => {
      if (firebaseUser && !isWelcome) {
        const authUserRef = doc(db, 'users', firebaseUser.uid);
        const authUserSnap = await getDoc(authUserRef);
        authUserSnap.exists()
          ? setAuthUser(authUserSnap.data())
          : setAuthUser(null);
      } else {
        setAuthUser(null);
      }
    });

    setIsSp(isSp);
    setIsTablet(isTablet);

    return () => {
      unSub();
    };

    // Ignore the warning of "React Hook useEffect has a missing dependency"
    // eslint-disable-next-line
  }, [isSp, isTablet]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="*"
          element={!isWelcome ? <Main /> : <Navigate replace to="/welcome" />}
        />
        <Route
          path="/welcome"
          element={isWelcome ? <UserSetting /> : <Navigate replace to="/" />}
        />
        <Route path="/:userName/setting" element={<UserSetting />} />
        <Route path="/editor/new" element={<Editor />} />
        <Route path="/editor/articles/:aid" element={<Editor />} />
        <Route path="/editor/drafts/:did" element={<Editor />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
