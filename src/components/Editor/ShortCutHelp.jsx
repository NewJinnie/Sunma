import { VStack, Text, Kbd, Flex, Box } from '@chakra-ui/react';
import React from 'react';

const shortCutKeys = [
  {
    name: '見出し1（H1）',
    fontSize: 'xl',
    as: 'b',
    key1: '#',
    key2: 'space',
  },
  {
    name: '見出し2（H2）',
    fontSize: 'lg',
    as: 'b',
    key1: '##',
    key2: 'space',
  },
  {
    name: '見出し3（H3）',
    fontSize: 'md',
    as: 'b',
    key1: '###',
    key2: 'space',
  },
  {
    name: '太字',
    as: 'b',
    key1: 'Ctrl',
    cmd: 'Cmd',
    or: 'or',
    key2: 'b',
  },
  {
    name: '斜体',
    as: 'i',
    key1: 'Ctrl',
    cmd: 'Cmd',
    or: 'or',
    key2: 'i',
  },
  {
    name: '下線',
    as: 'u',
    key1: 'Ctrl',
    cmd: 'Cmd',
    or: 'or',
    key2: 'u',
  },
  {
    name: '取消し線',
    as: 's',
    key1: 'Ctrl',
    cmd: 'Cmd',
    or: 'or',
    key2: 's',
  },
  {
    name: 'リスト',
    key1: '-',
    key2: 'space',
  },
  {
    name: '数字リスト',
    key1: '1.',
    key2: 'space',
  },
  {
    name: 'コード',
    as: 'e',
    key1: 'Ctrl',
    cmd: 'Cmd',
    or: 'or',
    key2: 'e',
  },
  {
    name: 'コードブロック',
    key1: '```',
    key2: 'space',
  },
];

const ShortCutHelp = () => {
  return (
    <>
      <Flex style={{ alignItems: 'flex-start', position: 'top', top: '1em' }}>
        <Text padding="0.5em" fontWeight="bold">
          ShortCut Keys
        </Text>
      </Flex>
      <VStack w="100%" h="80vh" alignItems="flex-start" paddingLeft="10px">
        <Box overflowY="auto" h="100%" w="100%">
          {shortCutKeys.map((shortCutKey, i) => (
            <VStack key={i} alignItems="baseline" gap="5px" marginBottom="15px">
              <Text
                as={shortCutKey.as && shortCutKey.as}
                fontSize={shortCutKey.fontSize ? shortCutKey.fontSize : 'sm'}
              >
                {shortCutKey.name}
              </Text>
              <span>
                <Kbd>{shortCutKey.key1}</Kbd> {shortCutKey.cmd && 'or'}{' '}
                {shortCutKey.cmd && <Kbd>{shortCutKey.cmd}</Kbd>} +{' '}
                <Kbd>{shortCutKey.key2}</Kbd>
              </span>
            </VStack>
          ))}
        </Box>
      </VStack>
    </>
  );
};

export default ShortCutHelp;
