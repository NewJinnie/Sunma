import React from 'react';
import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  HStack,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  ModalHeader,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { db, storage } from '../../common/firebaseConfig';
import { useAtomValue } from 'jotai';
import { authUserAtom, editorFilesAtom } from '../../state/atoms';
import moment from 'moment';
import { ref, getDownloadURL, uploadBytes } from 'firebase/storage';

const EditorHeader = ({ editor, title, tags, tocItems, aid, did }) => {
  const navigate = useNavigate();
  const authUser = useAtomValue(authUserAtom);
  const editorFiles = useAtomValue(editorFilesAtom);
  const tocItemsForFS = tocItems.map(item => ({
    id: item.id,
    level: item.level,
    textContent: item.textContent,
  }));
  const tagsForFS = tags.map(tag => tag.text);

  const storeModal = useDisclosure();
  const closeModal = useDisclosure();

  const articleType = {
    DRAFT: 'drafts',
    PUBLIC: 'articles',
  };

  const storeArticle = async type => {
    const contentJson = editor.getJSON();
    const editorContents = contentJson.content;
    const editorContentsForImage = await Promise.all(
      editorContents.map(async e => {
        if (
          e.type === 'image' &&
          editorFiles.some(editorFile => editorFile.id === e.attrs.id)
        ) {
          const fileForUpload = editorFiles.find(
            editorFile => editorFile.id === e.attrs.id
          );
          const imageStorageRef = ref(
            storage,
            `users/${authUser.uid}/articles/${fileForUpload.id}`
          );
          await uploadBytes(imageStorageRef, fileForUpload.fileObj);
          const url = await getDownloadURL(imageStorageRef);
          return { ...e, attrs: { ...e.attrs, src: url } };
        } else {
          return e;
        }
      })
    );

    const contentJsonForFS = {
      ...contentJson,
      content: editorContentsForImage,
    };

    const ngram = (words, n) => {
      var i;
      var grams = [];
      for (i = 0; i <= words.length - n; i++) {
        grams.push(words.substr(i, n));
      }

      return grams;
    };

    const titleSearchKeys = ngram(title, 2);
    const contentsWords = editorContents
      .flatMap(e =>
        e.content
          ? e.content.flatMap(e => (e.text === undefined ? [] : e.text))
          : []
      )
      .join('');
    const contentsSearchKeys = ngram(contentsWords, 2);
    const searchKeys = titleSearchKeys.concat(contentsSearchKeys);

    const newArticleObj = {
      uid: authUser.uid,
      title: title,
      searchKeys: searchKeys,
      tags: tagsForFS,
      tocItems: tocItemsForFS,
      content: contentJsonForFS,
      createdAt: moment().format(),
      updatedAt: moment().format(),
    };

    if (!aid && !did) {
      await addDoc(collection(db, 'users', authUser.uid, type), newArticleObj);
    } else if (did && type === 'articles') {
      await deleteDoc(doc(db, 'users', authUser.uid, 'drafts', did));
      await addDoc(collection(db, 'users', authUser.uid, type), newArticleObj);
    } else {
      let updatedArticleObj = {
        title: title,
        searchKeys: searchKeys,
        tags: tagsForFS,
        tocItems: tocItemsForFS,
        content: contentJsonForFS,
      };

      if (aid) {
        updatedArticleObj = {
          ...updatedArticleObj,
          updatedAt: moment().format(),
        };
      }

      await updateDoc(
        aid
          ? doc(db, 'users', authUser.uid, type, aid)
          : doc(db, 'users', authUser.uid, type, did),
        updatedArticleObj
      );
    }
  };

  const storeAndNavigate = async type => {
    if (title.length > 60) {
      window.alert('タイトルは60文字以下にしてください');
    } else if (title === '') {
      window.alert('タイトルは必須です');
    } else {
      await storeArticle(type);
      navigate(`/users/${authUser.uid}`);
    }
  };

  if (authUser) {
    return (
      <>
        <Box w="100%" h="4em">
          <Grid templateColumns="repeat(100, 1fr)">
            <GridItem colSpan={10}>
              <Flex h="100%" justifyContent="flex-start" alignItems="center">
                <Button variant="ghost" size="sm" onClick={closeModal.onOpen}>
                  閉じる
                </Button>

                <Modal isOpen={closeModal.isOpen} onClose={closeModal.onClose}>
                  <ModalOverlay />
                  <ModalContent>
                    <ModalHeader />
                    <ModalCloseButton />
                    <ModalBody>閉じてよろしいですか？</ModalBody>
                    <ModalBody>※下書きは保存されません</ModalBody>

                    <ModalFooter>
                      <Button
                        variant="ghost"
                        mr={3}
                        onClick={closeModal.onClose}
                      >
                        キャンセル
                      </Button>
                      <Button
                        variant="ghost"
                        colorScheme="red"
                        onClick={() =>
                          aid
                            ? navigate(`/users/${authUser.uid}/articles/${aid}`)
                            : did
                            ? navigate(`/users/${authUser.uid}`)
                            : navigate('/')
                        }
                      >
                        エディターを閉じる
                      </Button>
                    </ModalFooter>
                  </ModalContent>
                </Modal>
              </Flex>
            </GridItem>
            <GridItem colSpan={70}></GridItem>
            <GridItem colSpan={20} style={{ position: 'fixed', right: '10px' }}>
              <HStack>
                {!aid && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => storeAndNavigate(articleType.DRAFT)}
                  >
                    <Text fontSize="xs">下書き保存</Text>
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={storeModal.onOpen}>
                  <Text fontSize="xs">公開へ進む</Text>
                </Button>
              </HStack>
            </GridItem>
          </Grid>
        </Box>

        <Modal isOpen={storeModal.isOpen} onClose={storeModal.onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader />
            <ModalCloseButton />
            <ModalBody>投稿してよろしいですか？</ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={storeModal.onClose}>
                キャンセル
              </Button>
              <Button
                variant="ghost"
                colorScheme="teal"
                onClick={() => storeAndNavigate(articleType.PUBLIC)}
              >
                投稿する
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    );
  }
};

export default EditorHeader;
