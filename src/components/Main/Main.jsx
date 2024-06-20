import React from 'react';
import { ChakraProvider, Box, VStack, theme, Flex } from '@chakra-ui/react';
import Header from './Header';
import Posts from './Posts';
import Footer from './Footer';
import { Route, Routes } from 'react-router-dom';
import UserDetail from '../Detail/UserDetail';
import PostDetail from '../Detail/PostDetail';
import { useAtomValue } from 'jotai';
import { isSpAtom } from '../../state/atoms';
import Terms from '../Legal/Terms';
import PrivacyPolicy from '../Legal/PrivacyPolicy';
import NotFoundPage from './NotFoundPage';

const Main = () => {
  const isSp = useAtomValue(isSpAtom);

  const MainDisplay = () => {
    return (
      <VStack w="100%" justifyContent="center">
        <Box w="100%">
          <Posts />
        </Box>
      </VStack>
    );
  };

  return (
    <ChakraProvider theme={theme}>
      <Flex w="100%" h="8vh" justifyContent="center" alignItems="center">
        <Header />
      </Flex>
      <Box w="100%" bg="#f5f6f6" pb="5em">
        <Routes>
          <Route path="/" element={<MainDisplay />} />
          <Route path="/users/:uid" element={<UserDetail />} />
          <Route path="/users/:uid/articles/:aid" element={<PostDetail />} />
          <Route path="/tag/:tag" element={<MainDisplay />} />
          <Route path="/search/:searchWords" element={<MainDisplay />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/notfound" element={<NotFoundPage />} />
          <Route path="/*" element={<NotFoundPage />} />
        </Routes>
      </Box>
      <Flex
        w="100%"
        h={isSp ? '30vh' : '20vh'}
        justifyContent="center"
        alignItems="baseline"
      >
        <Footer />
      </Flex>
    </ChakraProvider>
  );
};

export default Main;
