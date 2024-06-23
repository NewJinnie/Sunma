import React, { useState } from 'react';
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
  setDoc,
  getDocs,
} from 'firebase/firestore';
import { db, storage } from '../../common/firebaseConfig';
import { useAtomValue } from 'jotai';
import { authUserAtom, editorFilesAtom } from '../../state/atoms';
import moment from 'moment';
import { ref, getDownloadURL, uploadBytes } from 'firebase/storage';

const EditorHeader = ({ editor, title, tags, tocItems, aid, did }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

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

    const sliceByNumber = (array, number) => {
      const length = Math.ceil(array.length / number);
      return new Array(length)
        .fill()
        .map((_, i) => array.slice(i * number, (i + 1) * number));
    };

    const editorContentsForFS = sliceByNumber(editorContentsForImage, 10);

    const ngram = (words, n) => {
      var i;
      var grams = [];
      for (i = 0; i <= words.length - n; i++) {
        grams.push(words.substr(i, n));
      }

      return grams;
    };

    const titleSearchKeys = ngram(title, 2);

    const newArticleObj = {
      uid: authUser.uid,
      title: title,
      searchKeys: titleSearchKeys,
      tags: tagsForFS,
      tocItems: tocItemsForFS,
      createdAt: moment().format(),
      updatedAt: moment().format(),
    };

    const articleTypeRef = doc(collection(db, 'users', authUser.uid, type));
    const articleContentsIdsColl = collection(
      db,
      'users',
      authUser.uid,
      type,
      articleTypeRef.id,
      'contentIds'
    );

    if (!aid && !did) {
      await setDoc(articleTypeRef, newArticleObj);

      let contentIds = [];
      for (const [index, content] of editorContentsForFS.entries()) {
        const contentId = Math.random().toString();
        await setDoc(
          doc(
            db,
            'users',
            authUser.uid,
            type,
            articleTypeRef.id,
            'contents',
            contentId
          ),
          {
            content: content,
            index: index,
          }
        );
        contentIds.push(contentId);
      }
      for (const contentId of contentIds) {
        await addDoc(articleContentsIdsColl, { contentId: contentId });
      }
    } else if (did && type === 'articles') {
      await deleteDoc(doc(db, 'users', authUser.uid, 'drafts', did));
      await setDoc(articleTypeRef, newArticleObj);

      let contentIds = [];
      for (const [index, content] of editorContentsForFS.entries()) {
        const contentId = Math.random().toString();
        await setDoc(
          doc(
            db,
            'users',
            authUser.uid,
            type,
            articleTypeRef.id,
            'contents',
            contentId
          ),
          {
            content: content,
            index: index,
          }
        );
        contentIds.push(contentId);
      }
      for (const contentId of contentIds) {
        await addDoc(articleContentsIdsColl, { contentId: contentId });
      }
    } else {
      const articleContentIdsForDeleteColl = aid
        ? collection(db, 'users', authUser.uid, 'articles', aid, 'contentIds')
        : collection(db, 'users', authUser.uid, 'drafts', did, 'contentIds');
      const articleContentIdsForDeleteSnap = await getDocs(
        articleContentIdsForDeleteColl
      );
      for (const docData of articleContentIdsForDeleteSnap.docs) {
        (await aid)
          ? deleteDoc(
              doc(
                db,
                'users',
                authUser.uid,
                'articles',
                aid,
                'contentIds',
                docData.id
              )
            )
          : deleteDoc(
              doc(
                db,
                'users',
                authUser.uid,
                'drafts',
                did,
                'contentIds',
                docData.id
              )
            );
      }
      for (const docData of articleContentIdsForDeleteSnap.docs) {
        (await aid)
          ? deleteDoc(
              doc(
                db,
                'users',
                authUser.uid,
                'articles',
                aid,
                'contents',
                docData.data().contentId
              )
            )
          : deleteDoc(
              doc(
                db,
                'users',
                authUser.uid,
                'drafts',
                did,
                'contents',
                docData.data().contentId
              )
            );
      }

      let updatedArticleObj = {
        title: title,
        searchKeys: titleSearchKeys,
        tags: tagsForFS,
        tocItems: tocItemsForFS,
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

      let contentIds = [];
      for (const [index, content] of editorContentsForFS.entries()) {
        const contentId = Math.random().toString();
        (await aid)
          ? setDoc(
              doc(
                db,
                'users',
                authUser.uid,
                'articles',
                aid,
                'contents',
                contentId
              ),
              {
                content: content,
                index: index,
              }
            )
          : setDoc(
              doc(
                db,
                'users',
                authUser.uid,
                'drafts',
                did,
                'contents',
                contentId
              ),
              { content: content, index: index }
            );
        contentIds.push(contentId);
      }
      for (const contentId of contentIds) {
        await addDoc(articleContentIdsForDeleteColl, { contentId: contentId });
      }
    }
  };

  const storeAndNavigate = async type => {
    if (title.length > 60) {
      window.alert('タイトルは60文字以下にしてください');
    } else if (title === '') {
      window.alert('タイトルは必須です');
    } else {
      setIsLoading(true);
      await storeArticle(type);
      setIsLoading(false);
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
                isLoading={isLoading}
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
