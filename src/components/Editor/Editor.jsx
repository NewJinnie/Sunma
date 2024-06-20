import React, { useEffect, useState } from 'react';
import { WithContext as ReactTags } from 'react-tag-input';
import ShortCutHelp from './ShortCutHelp';
import Decolation from './Decolation';
import {
  Box,
  Center,
  ChakraProvider,
  Divider,
  Grid,
  GridItem,
  VStack,
  theme,
  IconButton,
  Icon,
  Input,
  HStack,
} from '@chakra-ui/react';
import { LuList, LuHelpCircle, LuChevronsLeft } from 'react-icons/lu';
import { useAtom, useAtomValue } from 'jotai';
import {
  editIsSide,
  authUserAtom,
  editorFilesAtom,
  isSpAtom,
  isTabletAtom,
} from '../../state/atoms';
import './styles.scss';
import EditorHeader from './EditorHeader';
import { EditorContent, useEditor } from '@tiptap/react';
import ToC from './ToC';
import { useParams, useLocation } from 'react-router-dom';
import { db } from '../../common/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import axios from 'axios';

//editor extentions
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import CharacterCount from '@tiptap/extension-character-count';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import {
  getHierarchicalIndexes,
  TableOfContents,
} from '@tiptap-pro/extension-table-of-contents';
import FileHandler from '@tiptap-pro/extension-file-handler';
import ImageResize from 'tiptap-extension-resize-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import LinkPreview from './LinkPreviewExtention';
import { Helmet } from 'react-helmet';

const MemorizedToC = React.memo(ToC);

const KeyCodes = {
  space: 32,
  enter: 13,
};

const delimiters = [KeyCodes.space, KeyCodes.enter];

const Editor = () => {
  const authUser = useAtomValue(authUserAtom);
  const { aid, did } = useParams();
  const isSp = useAtomValue(isSpAtom);
  const isTablet = useAtomValue(isTabletAtom);

  const [title, setTitle] = useState('');
  const [tags, setTags] = useState([]);
  const [tocItems, setTocItems] = useState([]);

  const [isSide, setIsSide] = useAtom(editIsSide);
  const [isToc, setIsToc] = useState(true);
  const [isHelp, setIsHelp] = useState(false);
  const [editorFiles, setEditorFiles] = useAtom(editorFilesAtom);
  const [image, setImage] = useState({
    id: 1,
    file: new File(['foo'], 'foo'),
  });

  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Typography,
      Underline,
      Color,
      TextStyle,
      CharacterCount,
      ImageResize,
      FileHandler.configure({
        allowedMimeTypes: ['image/png', 'image/jpeg'],
        onDrop: (editor, files) => {
          const [file] = files;
          const url = URL.createObjectURL(file);
          const photoId = Math.random();
          setImage({ id: photoId, fileObj: file });

          editor.chain().focus().setImage({ src: url, id: photoId }).run();
        },
        onPaste: (editor, files) => {
          const [file] = files;
          const url = URL.createObjectURL(file);
          const photoId = Math.random();
          setImage({ id: photoId, fileObj: file });

          editor.chain().focus().setImage({ src: url, id: photoId }).run();
        },
      }),
      Link,
      LinkPreview,
      CodeBlockLowlight.configure({
        lowlight: createLowlight(common),
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TableOfContents.configure({
        getIndex: getHierarchicalIndexes,
        onUpdate(content) {
          content.length !== 0 && setTocItems(content);
        },
      }),
      Placeholder.configure({
        placeholder: '会計に関するあなたの知見を共有しよう',
      }),
    ],
  });

  useEffect(() => {
    if (editor) {
      const tiptap = document.querySelector('.tiptap');
      tiptap &&
        tiptap.addEventListener('paste', event => {
          const paste = event.clipboardData.getData('text');
          const isUrl = URL.canParse(paste);

          if (isUrl) {
            axios
              .post(
                'https://api.linkpreview.net',
                {
                  q: paste,
                },
                {
                  headers: {
                    'X-Linkpreview-Api-Key':
                      process.env.REACT_APP_LINKPREVIEW_API_KEY,
                  },
                }
              )
              .then(response => {
                const { title, image, description, url } = response.data;
                const { to } = editor.view.state.selection;
                editor.commands.focus(to);
                editor.commands.enter();

                if (title && image) {
                  editor.commands.setLinkPreview({
                    src: image,
                    title: title,
                    description: description,
                    url: url,
                    textWrapperClass: 'link-preview-text-wrapper',
                    imageWrapperClass: 'link-preview-image-wrapper',
                    imageClass: 'link-preview-image',
                  });
                  editor.commands.enter();
                }
              })
              .catch(e => console.log(e));
          }
        });
    }
  }, [editor]);

  useEffect(() => {
    setEditorFiles([...editorFiles, image]);

    // Ignore the warning of "React Hook useEffect has a missing dependency"
    // eslint-disable-next-line
  }, [image]);

  useEffect(() => {
    const fetchArticle = async (type, id) => {
      const articleRef = doc(db, 'users', authUser.uid, type, id);
      const articleSnap = await getDoc(articleRef);
      const article = articleSnap.data();
      const { title, tags, content, tocItems } = article;

      const tagsForEditor = tags.map(tag => ({ id: tag, text: tag }));

      setTitle(title);
      setTags(tagsForEditor);
      setTocItems(tocItems);
      editor.commands.setContent(content);
    };

    if (authUser && aid && editor) {
      fetchArticle('articles', aid);
    } else if (authUser && did && editor) {
      fetchArticle('drafts', did);
    }
  }, [authUser, aid, did, editor]);

  const setIsTocActive = () => {
    if (isSide && !isToc) {
      setIsToc(true);
      setIsHelp(false);
    } else if (isSide && isToc) {
      setIsSide(false);
      setIsToc(false);
    } else {
      setIsSide(true);
      setIsToc(true);
      setIsHelp(false);
    }
  };

  const setIsHelpActive = () => {
    if (isSide && !isHelp) {
      setIsHelp(true);
      setIsToc(false);
    } else if (isSide && isHelp) {
      setIsSide(false);
      setIsHelp(false);
    } else {
      setIsSide(true);
      setIsHelp(true);
      setIsToc(false);
    }
  };

  const handleDelete = i => {
    setTags(tags.filter((tag, index) => index !== i));
  };

  const handleAddition = tag => {
    if (tag.text.length > 10) {
      window.alert('タグは10文字までです');
    } else if (tags.length === 4) {
      window.alert('タグは4つまでです');
    } else {
      setTags([...tags, tag]);
    }
  };

  return (
    <>
      {!editor ? (
        <></>
      ) : (
        <ChakraProvider theme={theme}>
          <Helmet title="エディター | Sunma" />

          <Box w="100%" h="100vh" bg="#FFFFFFE6">
            <Grid templateColumns="repeat(100, 1fr)">
              <GridItem colSpan={4}>
                <VStack
                  style={{
                    height: '3em',
                    gap: '1em',
                    top: '1em',
                    position: 'sticky',
                  }}
                >
                  <Center>
                    <IconButton
                      variant="ghost"
                      icon={<Icon as={LuList} />}
                      size="md"
                      onClick={() => setIsTocActive()}
                      isRound={true}
                    />
                  </Center>
                  <Center>
                    <IconButton
                      variant="ghost"
                      icon={<Icon as={LuHelpCircle} />}
                      size="md"
                      onClick={() => setIsHelpActive()}
                      isRound={true}
                    />
                  </Center>
                </VStack>
              </GridItem>
              {isSide ? (
                <GridItem colSpan={20}>
                  <VStack
                    style={{
                      alignItems: 'flex-start',
                      position: 'sticky',
                      top: '1em',
                    }}
                  >
                    <IconButton
                      variant="ghost"
                      size="md"
                      icon={<Icon as={LuChevronsLeft} />}
                      onClick={() => setIsSide(!isSide)}
                      isRound={true}
                    />
                    {isToc && (
                      <MemorizedToC editor={editor} tocItems={tocItems} />
                    )}
                    {isHelp && <ShortCutHelp />}
                  </VStack>
                </GridItem>
              ) : (
                <></>
              )}
              <GridItem colSpan={1}>
                <Divider h="1000vh" orientation="vertical" />
              </GridItem>
              <GridItem colSpan={isSide ? 75 : 95}>
                <VStack
                  style={{
                    position: 'sticky',
                    top: '0',
                    zIndex: 1,
                    paddingTop: '0.5em',
                  }}
                  bg="white"
                >
                  <EditorHeader
                    editor={editor}
                    title={title}
                    tags={tags}
                    tocItems={tocItems}
                    aid={aid}
                    did={did}
                  />
                  <Box
                    w="100%"
                    style={
                      isSide ? { padding: '0 3em' } : { padding: ' 0 15em' }
                    }
                  >
                    <VStack style={{ alignItems: 'flex-start', gap: '1em' }}>
                      <Input
                        placeholder="記事タイトル(最大60文字)"
                        variant="unstyled"
                        style={{
                          fontSize: '30px',
                          fontWeight: 'bold',
                        }}
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                      />
                      <HStack w="100%">
                        <ReactTags
                          tags={tags}
                          delimiters={delimiters}
                          handleDelete={handleDelete}
                          handleAddition={handleAddition}
                          inputFieldPosition="inline"
                          placeholder="スペース、エンター区切りでタグを入力できます(最大10文字、4つまで)"
                          autocomplete
                        />
                      </HStack>
                      <Decolation editor={editor} />
                    </VStack>
                  </Box>
                </VStack>
                <Box
                  w="100%"
                  style={
                    isSide
                      ? isSp || isTablet
                        ? { padding: '0 3em' }
                        : { padding: '0 15em 0 3em' }
                      : { padding: ' 0 20em 0 15em' }
                  }
                >
                  <EditorContent editor={editor} />
                </Box>
              </GridItem>
            </Grid>
          </Box>
        </ChakraProvider>
      )}
    </>
  );
};

export default Editor;
