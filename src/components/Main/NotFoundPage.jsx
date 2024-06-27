import { Flex, Box } from '@chakra-ui/react';
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const NotFoundPage = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <Flex justifyContent="center" alignItems="center" w="100%" h="100vh">
      <Box>404 NOT FOUND</Box>
    </Flex>
  );
};
export default NotFoundPage;
