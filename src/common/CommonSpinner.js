import React from 'react';
import { Flex, CircularProgress } from '@chakra-ui/react';

const CommonSpinner = () => {
  return (
    <Flex w="100vw" h="92vh" justifyContent="center" alignItems="center">
      <CircularProgress color="teal" isIndeterminate />
    </Flex>
  );
};

export default CommonSpinner;
