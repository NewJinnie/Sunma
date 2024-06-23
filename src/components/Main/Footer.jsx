import {
  Flex,
  StackItem,
  VStack,
  Text,
  Button,
  HStack,
  Image,
  Link,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import React from 'react';
import { useAtomValue } from 'jotai';
import { isSpAtom } from '../../state/atoms';
import fiscaLogo from '../../common/logo.svg';

const Footer = () => {
  const isSp = useAtomValue(isSpAtom);

  return (
    <Flex
      w="70%"
      h="100%"
      pt="30px"
      alignItems="baseline"
      flexFlow={isSp && 'column'}
    >
      <StackItem mr="auto">
        <RouterLink to="/">
          <VStack alignItems="baseline" gap="0">
            <HStack gap="2px">
              <Image src={fiscaLogo} h="30px" w="30px" />
              <Text
                as="kbd"
                fontWeight="bold"
                fontFamily="sans-serif"
                letterSpacing="2px"
                fontSize="xl"
              >
                Sunma
              </Text>
            </HStack>
            {!isSp ? (
              <>
                <Text fontSize="small" color="gray" pt="5px">
                  会計パーソンのための
                </Text>
                <Text fontSize="small" color="gray">
                  情報共有コミュニティ
                </Text>
              </>
            ) : (
              <Text fontSize="small" color="gray" pt="5px">
                会計パーソンのための情報共有コミュニティ
              </Text>
            )}
          </VStack>
        </RouterLink>
      </StackItem>
      <Flex
        justifyContent={isSp ? 'space-between' : 'flex-end'}
        w="100%"
        pt={isSp && '20px'}
      >
        <StackItem w="30%">
          <Text as="b">About</Text>
          <VStack alignItems="baseline" pt="5px">
            <Button size="sm" variant="link">
              Sunmaについて
            </Button>
            <Link href="https://forms.gle/bRxYWW8xxQFkB7v28" isExternal>
              <Button size="sm" variant="link">
                問い合わせ
              </Button>
            </Link>
          </VStack>
        </StackItem>
        <StackItem w="30%" mr={isSp && '10%'}>
          <Text as="b">Legal</Text>
          <VStack alignItems="baseline" pt="5px">
            <RouterLink to="/terms">
              <Button size="sm" variant="link">
                利用規約
              </Button>
            </RouterLink>
            <RouterLink to="/privacy-policy">
              <Button size="sm" variant="link">
                プライバシーポリシー
              </Button>
            </RouterLink>
          </VStack>
        </StackItem>
      </Flex>
    </Flex>
  );
};

export default Footer;
