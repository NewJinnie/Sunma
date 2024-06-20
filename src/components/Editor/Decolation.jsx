import {
  Box,
  Center,
  HStack,
  Icon,
  IconButton,
  Popover,
  PopoverContent,
  PopoverTrigger,
  StackItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  VStack,
  Input,
  Flex,
  Button,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import React, { useState } from 'react';
import './styles.scss';
import {
  LuBold,
  LuItalic,
  LuUnderline,
  LuStrikethrough,
  LuHighlighter,
  LuHeading1,
  LuHeading2,
  LuHeading3,
  LuQuote,
  LuList,
  LuLink,
  LuTable,
  LuImage,
  LuCode2,
  LuPlus,
  LuTrash2,
  LuChevronUp,
  LuChevronRight,
  LuChevronLeft,
  LuChevronDown,
} from 'react-icons/lu';
import { CgFormatColor } from 'react-icons/cg';
import { MdOutlineHorizontalRule } from 'react-icons/md';
import { PiListNumbers, PiCodeBlock } from 'react-icons/pi';
import Circle from '@uiw/react-color-circle';
import { useAtom } from 'jotai';
import { editorFilesAtom } from '../../state/atoms';

const redIsh = ['#f44e3b', '#d33115', '#9f0500'];
const orangeIsh = ['#fe9200', '#e27300', '#c45100'];
const yellowIsh = ['#fcdc00', '#fcc400', '#fb9e00'];
const ygIsh = ['#dbdf00', '#b0bc00', '#808900'];
const greenIsh = ['#a4dd00', '#68bc00', '#194d33'];
const lightbIsh = ['#68ccca', '#16a5a5', '#0c797d'];
const blueIsh = ['#73d8ff', '#009ce0', '#0062b1'];
const purpleIsh = ['#aea1ff', '#7b64ff', '#653294'];
const pinkIsh = ['#fda1ff', '#fa28ff', '#ab149e'];
const resetIsh = ['#000000', '#ffffff'];

const createColorPalatte = (...colorIshArrays) => {
  const colorArray = [];

  colorIshArrays.forEach(colorIshArray => colorArray.push(colorIshArray[0]));
  colorIshArrays.forEach(colorIshArray => colorArray.push(colorIshArray[1]));
  colorIshArrays.forEach(colorIshArray => colorArray.push(colorIshArray[2]));
  resetIsh.forEach(resetColor => colorArray.push(resetColor));

  return colorArray;
};

const colors = createColorPalatte(
  redIsh,
  orangeIsh,
  yellowIsh,
  ygIsh,
  greenIsh,
  lightbIsh,
  blueIsh,
  purpleIsh,
  pinkIsh
);

const Decolation = ({ editor }) => {
  const [textHex, setTextHex] = useState('');
  const [highlightHex, setHighlightHex] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [editorFiles, setEditorFiles] = useAtom(editorFilesAtom);

  const changeTextHex = textHex => {
    if (textHex === '#000000') {
      editor.commands.unsetColor();
      setTextHex('');
    } else {
      editor.chain().focus().setColor(textHex).run();
      setTextHex(textHex);
    }
  };

  const changeHighlightHex = highlightHex => {
    if (highlightHex === '#ffffff') {
      editor.chain().focus().unsetHighlight().run();
      setHighlightHex('');
    } else {
      editor.chain().focus().toggleHighlight({ color: highlightHex }).run();
      setHighlightHex(highlightHex);
    }
  };

  const onLinkModalOpen = () => {
    const previousUrl = editor.getAttributes('link').href;

    const { view, state } = editor;
    const { from, to } = view.state.selection;
    const previousText = state.doc.textBetween(from, to, '');
    setLinkUrl(previousUrl);
    setLinkText(previousText);

    onOpen();
  };

  const setLink = () => {
    const { view } = editor;
    const { from, to } = view.state.selection;
    editor.commands.deleteRange({ from, to });
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: linkText,
            marks: [
              {
                type: 'link',
                attrs: {
                  href: linkUrl,
                  target: '_blank',
                  rel: 'noopener noreferrer nofollow',
                },
              },
            ],
          },
        ],
      })
      .run();

    onClose();
  };

  const selectFile = () => {
    const fileElem = document.getElementById('fileElemDecolation');
    fileElem.click();
    fileElem.addEventListener('click', e => (e.target.value = ''));
  };

  const insertImage = e => {
    const [file] = e.target.files;
    if (file) {
      const url = URL.createObjectURL(file);
      const photoId = Math.random();
      setEditorFiles([...editorFiles, { id: photoId, fileObj: file }]);

      editor.chain().focus().setImage({ src: url, id: photoId }).run();
    }
  };

  return (
    <Box>
      <HStack w="100%">
        <StackItem>
          <Center>
            <IconButton
              size="sm"
              variant="ghost"
              isActive={editor.isActive('heading', { level: 1 })}
              onClick={() => {
                editor.chain().focus().toggleHeading({ level: 1 }).run();
              }}
              icon={<Icon as={LuHeading1} />}
            />
          </Center>
        </StackItem>
        <StackItem>
          <Center>
            <IconButton
              size="sm"
              variant="ghost"
              isActive={editor.isActive('heading', { level: 2 })}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              icon={<Icon as={LuHeading2} />}
            />
          </Center>
        </StackItem>
        <StackItem>
          <Center>
            <IconButton
              size="sm"
              variant="ghost"
              isActive={editor.isActive('heading', { level: 3 })}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              icon={<Icon as={LuHeading3} />}
            />
          </Center>
        </StackItem>
      </HStack>
      <HStack w="100%">
        <StackItem>
          <Center>
            <IconButton
              size="sm"
              variant="ghost"
              isActive={editor.isActive('bold')}
              icon={<Icon as={LuBold} />}
              onClick={() => editor.chain().focus().toggleBold().run()}
            />
          </Center>
        </StackItem>
        <StackItem>
          <Center>
            <IconButton
              size="sm"
              variant="ghost"
              isActive={editor.isActive('italic')}
              icon={<Icon as={LuItalic} />}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            />
          </Center>
        </StackItem>
        <StackItem>
          <Center>
            <IconButton
              size="sm"
              variant="ghost"
              isActive={editor.isActive('underline')}
              icon={<Icon as={LuUnderline} />}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            />
          </Center>
        </StackItem>
        <StackItem>
          <Center>
            <IconButton
              size="sm"
              variant="ghost"
              isActive={editor.isActive('strike')}
              icon={<Icon as={LuStrikethrough} />}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            />
          </Center>
        </StackItem>
        <StackItem>
          <Popover>
            <PopoverTrigger>
              <Center>
                <IconButton
                  size="sm"
                  variant="ghost"
                  icon={<Icon as={CgFormatColor} />}
                  isActive={editor.isActive('textStyle')}
                />
              </Center>
            </PopoverTrigger>
            <PopoverContent w="215px" bg="lightgrey" style={{ padding: '1em' }}>
              <Circle
                colors={colors}
                color={textHex}
                onChange={color => changeTextHex(color.hex)}
                reset
              />
            </PopoverContent>
          </Popover>
        </StackItem>
        <StackItem>
          <Popover>
            <PopoverTrigger>
              <Center>
                <IconButton
                  size="sm"
                  variant="ghost"
                  icon={<Icon as={LuHighlighter} />}
                  isActive={editor.isActive('highlight')}
                />
              </Center>
            </PopoverTrigger>
            <PopoverContent w="215px" bg="lightgrey" style={{ padding: '1em' }}>
              <Circle
                colors={colors}
                color={highlightHex}
                onChange={color => changeHighlightHex(color.hex)}
              />
            </PopoverContent>
          </Popover>
        </StackItem>
        <StackItem>
          <Center>
            <IconButton
              size="sm"
              variant="ghost"
              isActive={editor.isActive('blockquote')}
              icon={<Icon as={LuQuote} />}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            />
          </Center>
        </StackItem>
        <StackItem>
          <Center>
            <IconButton
              size="sm"
              variant="ghost"
              isActive={editor.isActive('link')}
              icon={<Icon as={LuLink} />}
              onClick={onLinkModalOpen}
            />
          </Center>

          <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader />
              <ModalCloseButton />
              <ModalBody>
                <VStack w="100%" justifyContent="center">
                  <Flex w="100%" justifyContent="flex-start">
                    <Text>URL</Text>
                  </Flex>
                  <Input
                    type="url"
                    w="100%"
                    value={linkUrl}
                    onChange={e => setLinkUrl(e.target.value)}
                  />
                  <Flex w="100%" justifyContent="flex-start">
                    <Text>テキスト</Text>
                  </Flex>
                  <Input
                    type="text"
                    w="100%"
                    value={linkText}
                    onChange={e => setLinkText(e.target.value)}
                  />
                </VStack>
              </ModalBody>
              <ModalFooter>
                <Button variant="outline" mr={3} onClick={onClose}>
                  キャンセル
                </Button>
                <Button variant="outline" colorScheme="teal" onClick={setLink}>
                  リンクを設定する
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </StackItem>
        <StackItem>
          <Center>
            <Menu>
              <MenuButton
                as={IconButton}
                variant="ghost"
                isActive={editor.isActive('table')}
                icon={<Icon as={LuTable} />}
                size="sm"
              />
              <MenuList>
                <MenuItem
                  fontSize="small"
                  icon={<Icon as={LuPlus} />}
                  onClick={() => {
                    editor.commands.enter();
                    editor.commands.selectNodeBackward();

                    editor
                      .chain()
                      .focus()
                      .insertTable({ rows: 3, cols: 2 })
                      .run();
                  }}
                >
                  テーブルを追加
                </MenuItem>

                <MenuItem
                  fontSize="small"
                  icon={<Icon as={LuChevronLeft} />}
                  onClick={() => editor.chain().focus().addColumnBefore().run()}
                >
                  前に列を追加
                </MenuItem>
                <MenuItem
                  fontSize="small"
                  icon={<Icon as={LuChevronRight} />}
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                >
                  後に列を追加
                </MenuItem>
                <MenuItem
                  fontSize="small"
                  icon={<Icon as={LuChevronUp} />}
                  onClick={() => editor.chain().focus().addRowBefore().run()}
                >
                  上に行を追加
                </MenuItem>
                <MenuItem
                  fontSize="small"
                  icon={<Icon as={LuChevronDown} />}
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                >
                  下に行を追加
                </MenuItem>
                <MenuItem
                  fontSize="small"
                  color="red"
                  icon={<Icon as={LuTrash2} />}
                  onClick={() => editor.chain().focus().deleteTable().run()}
                >
                  テーブルを削除
                </MenuItem>
                <MenuItem
                  fontSize="small"
                  color="red"
                  icon={<Icon as={LuTrash2} />}
                  onClick={() => editor.chain().focus().deleteColumn().run()}
                >
                  列を削除
                </MenuItem>
                <MenuItem
                  fontSize="small"
                  color="red"
                  icon={<Icon as={LuTrash2} />}
                  onClick={() => editor.chain().focus().deleteRow().run()}
                >
                  行を削除
                </MenuItem>
              </MenuList>
            </Menu>
          </Center>
        </StackItem>
        <StackItem>
          <Center>
            <input
              type="file"
              id="fileElemDecolation"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => insertImage(e)}
            />
            <IconButton
              size="sm"
              variant="ghost"
              icon={<Icon as={LuImage} />}
              onClick={selectFile}
            />
          </Center>
        </StackItem>
        <StackItem>
          <Center>
            <IconButton
              size="sm"
              variant="ghost"
              isActive={editor.isActive('bulletList')}
              icon={<Icon as={LuList} />}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            />
          </Center>
        </StackItem>
        <StackItem>
          <Center>
            <IconButton
              size="sm"
              variant="ghost"
              isActive={editor.isActive('orderedList')}
              icon={<Icon as={PiListNumbers} />}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            />
          </Center>
        </StackItem>
        <StackItem>
          <Center>
            <IconButton
              size="sm"
              variant="ghost"
              icon={<Icon as={MdOutlineHorizontalRule} />}
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
            />
          </Center>
        </StackItem>
        <StackItem>
          <Center>
            <IconButton
              size="sm"
              variant="ghost"
              icon={<Icon as={LuCode2} />}
              isActive={editor.isActive('code')}
              onClick={() => editor.chain().focus().toggleCode().run()}
            />
          </Center>
        </StackItem>
        <StackItem>
          <Center>
            <IconButton
              size="sm"
              variant="ghost"
              icon={<Icon as={PiCodeBlock} />}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              isActive={editor.isActive('codeBlock')}
            />
          </Center>
        </StackItem>
      </HStack>
    </Box>
  );
};

export default Decolation;
