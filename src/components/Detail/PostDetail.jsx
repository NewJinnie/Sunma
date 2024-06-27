import React, { useEffect, useState } from 'react';
import {
  useParams,
  Link as RouterLink,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { db } from '../../common/firebaseConfig';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  deleteDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
  addDoc,
  collectionGroup,
  where,
  getCountFromServer,
  limit,
  startAfter,
} from 'firebase/firestore';
import {
  Box,
  VStack,
  IconButton,
  Icon,
  Text,
  Heading,
  HStack,
  Tag,
  Card,
  CardBody,
  Avatar,
  StackItem,
  Textarea,
  Button,
  Flex,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Progress,
} from '@chakra-ui/react';
import { TiHeartFullOutline, TiHeartOutline } from 'react-icons/ti';
import {
  HiOutlineBookmark,
  HiBookmark,
  HiDotsHorizontal,
} from 'react-icons/hi';
import { LuFileEdit, LuTrash2 } from 'react-icons/lu';
import { useAtomValue } from 'jotai';
import { authUserAtom, isSpAtom, isTabletAtom } from '../../state/atoms';
import moment from 'moment';
import CommonSpinner from '../../common/CommonSpinner';
import ToC from '../Editor/ToC';
import { motion, useAnimationControls } from 'framer-motion';
import { Helmet } from 'react-helmet';

// editor-related
import { EditorContent } from '@tiptap/react';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
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
import LinkPreview from '../Editor/LinkPreviewExtention';

const PostDetail = () => {
  const { uid, aid } = useParams();
  const authUser = useAtomValue(authUserAtom);
  const amI = authUser ? uid === authUser.uid : false;
  const isSp = useAtomValue(isSpAtom);
  const isTablet = useAtomValue(isTabletAtom);
  const postLikeControls = useAnimationControls();
  const commentLikeControls = useAnimationControls();

  const [article, setArticle] = useState(undefined);
  const likeUsersDrawer = useDisclosure();
  const postDeleteModal = useDisclosure();
  const btnRef = React.useRef();
  const [articleLikeUsers, setArticleLikeUsers] = useState([]);
  const [isLikeUsersLoading, setIsLikeUsersLoading] = useState(false);
  const [isPostDeleteLoading, setIsPostDeleteLoading] = useState(false);
  const navigate = useNavigate();

  const [author, setAuthor] = useState(undefined);
  const [isLikeActive, setIsLikeActive] = useState(undefined);
  const [isLikeAnimation, setIsLikeAnimation] = useState(false);
  const [isStockActive, setIsStockActive] = useState(undefined);
  const [editor, setEditor] = useState(undefined);

  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([]);
  const [isNewCommentLoading, setIsNewCommentLoading] = useState(false);
  const [isUpdateCommentLoading, setIsUpdateCommentLoading] = useState(false);

  const [editorContents, setEditorContents] = useState(undefined);

  const [contentCount, setContentCount] = useState(0);
  const [contentFetchCount, setContentFetchCount] = useState(0);
  const isContentMax = contentCount === contentFetchCount;
  const [lastContentVisible, setLastContentVisible] = useState(undefined);
  const [isContentFetch, setIsContentFetch] = useState(false);

  const storeType = {
    NEW: 'NEW',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
  };

  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    const linkPreviewStyleObj = {
      textWrapperClass: 'link-preview-text-wrapper',
      imageWrapperClass: 'link-preview-image-wrapper',
      imageClass: 'link-preview-image',
    };
    const linkPreviewStyleObjForSp = {
      textWrapperClass: 'link-preview-text-wrapper-sp',
      imageWrapperClass: 'link-preview-image-wrapper-sp',
      imageClass: 'link-preview-image-sp',
    };

    const setLinkPreviewStyle = styleObj => {
      const updatedContents = editorContents.map(content => {
        if (content.type === 'linkPreview') {
          const textWrapperClass = styleObj.textWrapperClass;
          const imageWrapperClass = styleObj.imageWrapperClass;
          const imageClass = styleObj.imageClass;

          return {
            ...content,
            attrs: {
              ...content.attrs,
              textWrapperClass: textWrapperClass,
              imageWrapperClass: imageWrapperClass,
              imageClass: imageClass,
            },
          };
        } else {
          return content;
        }
      });

      return updatedContents;
    };

    if (
      editor &&
      editorContents &&
      isSp !== undefined &&
      isTablet !== undefined
    ) {
      let contents;
      if (isSp) {
        contents = setLinkPreviewStyle(linkPreviewStyleObjForSp);
      } else if (isTablet) {
        contents = setLinkPreviewStyle(linkPreviewStyleObjForSp);
      } else {
        contents = setLinkPreviewStyle(linkPreviewStyleObj);
      }

      const updatedEditorJson = { ...editor.getJSON(), content: contents };
      editor.commands.setContent(updatedEditorJson);
    }
  }, [isSp, isTablet, editor, editorContents]);

  useEffect(() => {
    const editorInstance = new Editor({
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
        FileHandler,
        Link,
        LinkPreview,
        CodeBlockLowlight.configure({
          lowlight: createLowlight(common),
        }),
        Table.extend({
          renderHTML({ HTMLAttributes }) {
            return [
              'div',
              { class: 'tableWrapper' },
              ['table', HTMLAttributes, ['tbody', 0]],
            ];
          },
        }),
        TableRow,
        TableHeader,
        TableCell,
        TableOfContents.configure({
          getIndex: getHierarchicalIndexes,
        }),
      ],
    });

    const fetchArticle = async () => {
      if (!article) {
        const authorRef = doc(db, 'users', uid);
        const articleRef = doc(db, 'users', uid, 'articles', aid);
        const likedColl = collection(
          db,
          'users',
          uid,
          'articles',
          aid,
          'likedBy'
        );
        const stockedColl = collection(
          db,
          'users',
          uid,
          'articles',
          aid,
          'stockedBy'
        );
        const commentedColl = collection(
          db,
          'users',
          uid,
          'articles',
          aid,
          'commentedBy'
        );
        const commentedQuery = query(
          commentedColl,
          orderBy('createdAt', 'asc')
        );

        const authorSnap = await getDoc(authorRef);
        const articleSnap = await getDoc(articleRef);

        if (!authorSnap.exists() || !articleSnap.exists()) {
          navigate('/notfound');
        } else {
          const commentedSnap = await getDocs(commentedQuery);
          const likedCollSnap = await getCountFromServer(likedColl);
          const stockedCollSnap = await getCountFromServer(stockedColl);

          const articleContentsColl = collection(
            db,
            'users',
            uid,
            'articles',
            aid,
            'contents'
          );
          const articleContentsCountSnap = await getCountFromServer(
            articleContentsColl
          );
          setContentCount(articleContentsCountSnap.data().count);

          const articleContentsQuery = query(
            articleContentsColl,
            orderBy('index', 'asc'),
            limit(1)
          );
          const articleContentsSnap = await getDocs(articleContentsQuery);

          const lastVisible =
            articleContentsSnap.docs[articleContentsSnap.docs.length - 1];

          const articleContents = articleContentsSnap.docs.flatMap(
            docData => docData.data().content
          );

          const tiptapContent = {
            type: 'doc',
            content: articleContents,
          };

          setAuthor(authorSnap.data());
          setArticle({
            ...articleSnap.data(),
            likedCount: likedCollSnap.data().count,
            stockedCount: stockedCollSnap.data().count,
            content: tiptapContent,
          });

          let authUserCommentLikes = [];

          if (authUser) {
            const authUserCommentLikesRef = collection(
              db,
              'users',
              authUser.uid,
              'commentLikes'
            );
            const authUserCommentLikesSnap = await getDocs(
              authUserCommentLikesRef
            );
            authUserCommentLikes = authUserCommentLikesSnap.docs.map(
              like => like.id
            );
          }

          const comments = await Promise.all(
            commentedSnap.docs.map(async comment => {
              const userRef = doc(db, 'users', comment.data().uid);
              const userSnap = await getDoc(userRef);
              const commentLikedByColl = collection(
                db,
                'users',
                uid,
                'articles',
                aid,
                'commentedBy',
                comment.id,
                'commentLikedBy'
              );
              const commentLikedBySnap = await getCountFromServer(
                commentLikedByColl
              );

              const isLike = authUserCommentLikes.some(
                cid => cid === comment.id
              );

              return {
                cid: comment.id,
                userName: userSnap.exists()
                  ? userSnap.data().userName
                  : '退会したユーザー',
                photoUrl: userSnap.exists() ? userSnap.data().photoUrl : '',
                isLike: isLike,
                isEditable: false,
                likedCount: commentLikedBySnap.data().count,
                ...comment.data(),
              };
            })
          );

          setComments(comments);

          editorInstance.commands.setContent(tiptapContent);
          editorInstance.setEditable(false);
          setEditor(editorInstance);
          setEditorContents(editorInstance.getJSON().content);
          setLastContentVisible(lastVisible);
          setContentFetchCount(contentFetchCount + 1);
          setIsContentFetch(true);
        }
      }
    };

    const fetchReaction = async type => {
      const reactionRef =
        type === 'like'
          ? doc(db, 'users', uid, 'articles', aid, 'likedBy', authUser.uid)
          : doc(db, 'users', uid, 'articles', aid, 'stockedBy', authUser.uid);

      const reactionSnap = await getDoc(reactionRef);
      const isReaction = reactionSnap.exists();

      switch (type) {
        case 'like':
          setIsLikeActive(isReaction);
          break;
        case 'stock':
          setIsStockActive(isReaction);
          break;
        default:
          break;
      }
    };

    fetchArticle();

    if (authUser) {
      fetchReaction('like');
      fetchReaction('stock');
    } else {
      setIsLikeActive(false);
      setIsStockActive(false);
    }

    // Ignore the warning of "React Hook useEffect has a missing dependency"
    // eslint-disable-next-line
  }, [authUser]);

  useEffect(() => {
    const fetchMoreArticleContent = async () => {
      const articleContentQuery = query(
        collection(db, 'users', uid, 'articles', aid, 'contents'),
        orderBy('index', 'asc'),
        startAfter(lastContentVisible),
        limit(1)
      );
      const articleContentSnap = await getDocs(articleContentQuery);

      const fetchedArticleContents = articleContentSnap.docs.flatMap(
        docData => docData.data().content
      );
      const updatedArticleContents = editorContents.concat(
        fetchedArticleContents
      );

      const tiptapContent = {
        type: 'doc',
        content: updatedArticleContents,
      };

      editor.commands.setContent(tiptapContent);
      setEditorContents(updatedArticleContents);

      const lastVisible =
        articleContentSnap.docs[articleContentSnap.docs.length - 1];
      setLastContentVisible(lastVisible);
      setContentFetchCount(contentFetchCount => contentFetchCount + 1);
    };

    if (isContentFetch && lastContentVisible && editor && !isContentMax) {
      setIsContentFetch(false);
      fetchMoreArticleContent();
      setIsContentFetch(true);
    }
  }, [
    isContentMax,
    lastContentVisible,
    contentFetchCount,
    aid,
    editor,
    editorContents,
    uid,
    isContentFetch,
  ]);

  const updateReactions = async type => {
    const authUserReactionRef =
      type === 'like'
        ? doc(db, 'users', authUser.uid, 'likes', aid)
        : doc(db, 'users', authUser.uid, 'stocks', aid);
    const authUserReactionObj = {
      uid: uid,
      aid: aid,
      auid: authUser.uid,
      createdAt: moment().format(),
    };

    const reactionRef =
      type === 'like'
        ? doc(db, 'users', uid, 'articles', aid, 'likedBy', authUser.uid)
        : doc(db, 'users', uid, 'articles', aid, 'stockedBy', authUser.uid);

    const reactionObj = {
      aid: aid,
      uid: authUser.uid,
      auid: uid,
      createdAt: moment().format(),
    };

    const authorNotificationRef = collection(db, 'users', uid, 'notifications');
    const notificationObj = {
      aid: aid,
      uid: authUser.uid,
      auid: uid,
      actionType: '',
      isRead: false,
      createdAt: moment().format(),
    };

    switch (type) {
      case 'like':
        if (!isLikeActive) {
          const updatedArticle = {
            ...article,
            likedCount: article.likedCount + 1,
          };
          setArticle(updatedArticle);
          await setIsLikeActive(true);
          await setIsLikeAnimation(true);
          await postLikeControls.start({ scale: [1, 1.3, 1.6, 1.3, 1] });
          setIsLikeAnimation(false);

          await setDoc(reactionRef, reactionObj);
          await setDoc(authUserReactionRef, authUserReactionObj);
          await addDoc(authorNotificationRef, {
            ...notificationObj,
            actionType: 'いいね！',
          });
        } else {
          const updatedArticle = {
            ...article,
            likedCount: article.likedCount - 1,
          };
          setArticle(updatedArticle);
          setIsLikeActive(false);

          await deleteDoc(reactionRef);
          await deleteDoc(authUserReactionRef);
        }
        break;
      case 'stock':
        if (!isStockActive) {
          const updatedArticle = {
            ...article,
            stockedCount: article.stockedCount + 1,
          };
          setArticle(updatedArticle);
          setIsStockActive(true);

          await setDoc(reactionRef, reactionObj);
          await setDoc(authUserReactionRef, authUserReactionObj);
          await addDoc(authorNotificationRef, {
            ...notificationObj,
            actionType: 'ストック',
          });
        } else {
          const updatedArticle = {
            ...article,
            stockedCount: article.stockedCount - 1,
          };
          setArticle(updatedArticle);
          setIsStockActive(false);

          await deleteDoc(reactionRef);
          await deleteDoc(authUserReactionRef);
        }
        break;
      default:
        break;
    }
  };

  const displayDate = () => {
    return (
      <>
        <Text fontSize="small" color="gray">{`投稿日 ${moment(
          article.createdAt
        ).format('LL')}`}</Text>
        <Text fontSize="small" color="gray">
          {`最終更新日 ${moment(article.updatedAt).format('LL')}`}
        </Text>
      </>
    );
  };

  const displayArticleLikeUsers = async () => {
    likeUsersDrawer.onOpen();
    if (articleLikeUsers.length === 0) {
      setIsLikeUsersLoading(true);

      const likedByQuery = query(
        collection(db, 'users', uid, 'articles', aid, 'likedBy'),
        orderBy('createdAt', 'desc')
      );
      const likedBySnap = await getDocs(likedByQuery);

      const likingUsers = await Promise.all(
        likedBySnap.docs.map(async like => {
          const userRef = doc(db, 'users', like.id);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            return {
              uid: userSnap.data().uid,
              userName: userSnap.data().userName,
              photoUrl: userSnap.data().photoUrl,
              selfIntroduction: userSnap.data().selfIntroduction,
            };
          } else {
            return {
              uid: '',
              userName: '退会したユーザー',
              photoUrl: '',
              selfIntroduction: '',
            };
          }
        })
      );

      setIsLikeUsersLoading(false);
      setArticleLikeUsers(likingUsers);
    }
  };

  const displayLikes = () => {
    return (
      <>
        <Box
          as={motion.div}
          cursor="pointer"
          onClick={() => updateReactions('like')}
          animate={postLikeControls}
        >
          <IconButton
            icon={
              <Icon as={isLikeActive ? TiHeartFullOutline : TiHeartOutline} />
            }
            isRound={true}
            variant={isLikeAnimation ? 'ghost' : 'outline'}
            colorScheme="teal"
            isActive={isLikeActive && !isLikeAnimation}
            _hover={isLikeAnimation && { backgroundColor: '#f5f6f6' }}
            size="lg"
            isDisabled={authUser ? amI : true}
          />
        </Box>
        <Button
          ref={btnRef}
          onClick={() => displayArticleLikeUsers()}
          variant="link"
          color="gray"
        >
          {article.likedCount}
        </Button>
        <Drawer
          isOpen={likeUsersDrawer.isOpen}
          placement="right"
          onClose={likeUsersDrawer.onClose}
          finalFocusRef={btnRef}
        >
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>いいねしたユーザー</DrawerHeader>
            <DrawerBody>
              {isLikeUsersLoading ? (
                <Text>読み込み中...</Text>
              ) : (
                articleLikeUsers.length !== 0 && (
                  <VStack>
                    {articleLikeUsers.map(likeUser => (
                      <HStack key={likeUser.uid} w="100%">
                        <RouterLink to={`/users/${likeUser.uid}`}>
                          <Avatar
                            name={likeUser.userName}
                            src={likeUser.photoUrl}
                            size="sm"
                          />
                        </RouterLink>

                        <VStack alignItems="baseline">
                          <Button
                            variant="link"
                            onClick={() => navigate(`/users/${likeUser.uid}`)}
                            color="gray"
                          >
                            {likeUser.userName}
                          </Button>

                          <Text isTruncated w="100%">
                            {likeUser.selfIntroduction &&
                              likeUser.selfIntroduction}
                          </Text>
                        </VStack>
                      </HStack>
                    ))}
                  </VStack>
                )
              )}
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </>
    );
  };

  const displayStocks = () => {
    return (
      <>
        <IconButton
          icon={<Icon as={isStockActive ? HiBookmark : HiOutlineBookmark} />}
          isRound={true}
          variant="outline"
          colorScheme="teal"
          onClick={() => updateReactions('stock')}
          isActive={isStockActive}
          size="lg"
          isDisabled={authUser ? amI : true}
        />
        <Text color="gray">{article.stockedCount}</Text>
      </>
    );
  };

  const storeComment = async (type, commentElem) => {
    const authorNotificationRef = collection(db, 'users', uid, 'notifications');
    const notificationObj = {
      aid: aid,
      uid: authUser.uid,
      auid: uid,
      actionType: '',
      isRead: false,
      createdAt: moment().format(),
    };

    switch (type) {
      case 'NEW':
        setIsNewCommentLoading(true);

        const commentObj = {
          comment: newComment,
          createdAt: moment().format(),
        };

        const commentRef = doc(
          collection(db, 'users', authUser.uid, 'comments')
        );
        await setDoc(commentRef, {
          ...commentObj,
          aid: aid,
          uid: author.uid,
          auid: authUser.uid,
        });
        await setDoc(
          doc(db, 'users', uid, 'articles', aid, 'commentedBy', commentRef.id),
          { ...commentObj, aid: aid, auid: author.uid, uid: authUser.uid }
        );
        authUser.uid !== author.uid &&
          (await addDoc(authorNotificationRef, {
            ...notificationObj,
            actionType: 'コメント',
          }));

        setIsNewCommentLoading(false);
        break;
      case 'UPDATE':
        setIsUpdateCommentLoading(true);

        await updateDoc(
          doc(db, 'users', authUser.uid, 'comments', commentElem.cid),
          {
            comment: commentElem.comment,
          }
        );
        await updateDoc(
          doc(
            db,
            'users',
            uid,
            'articles',
            aid,
            'commentedBy',
            commentElem.cid
          ),
          {
            comment: commentElem.comment,
          }
        );

        setIsUpdateCommentLoading(false);
        break;
      case 'DELETE':
        await deleteDoc(
          doc(db, 'users', authUser.uid, 'comments', commentElem.cid)
        );
        await deleteDoc(
          doc(db, 'users', uid, 'articles', aid, 'commentedBy', commentElem.cid)
        );
        break;
      default:
        break;
    }

    const commentsRef = collection(
      db,
      'users',
      uid,
      'articles',
      aid,
      'commentedBy'
    );
    const commentsQuery = query(commentsRef, orderBy('createdAt', 'asc'));
    const commentsSnap = await getDocs(commentsQuery);

    let authUserCommentLikes = [];

    if (authUser) {
      const authUserCommentLikesRef = collection(
        db,
        'users',
        authUser.uid,
        'commentLikes'
      );
      const authUserCommentLikesSnap = await getDocs(authUserCommentLikesRef);
      authUserCommentLikes = authUserCommentLikesSnap.docs.map(like => like.id);
    }

    const comments = await Promise.all(
      commentsSnap.docs.map(async comment => {
        const userRef = doc(db, 'users', comment.data().uid);
        const userSnap = await getDoc(userRef);
        const isLike = authUserCommentLikes.some(cid => cid === comment.id);
        const commentLikedByColl = collection(
          db,
          'users',
          uid,
          'articles',
          aid,
          'commentedBy',
          comment.id,
          'commentLikedBy'
        );
        const commentLikedBySnap = await getCountFromServer(commentLikedByColl);

        return {
          cid: comment.id,
          userName: userSnap.exists()
            ? userSnap.data().userName
            : '退会したユーザー',
          photoUrl: userSnap.exists() ? userSnap.data().photoUrl : '',
          isLike: isLike,
          isEditable: false,
          likedCount: commentLikedBySnap.data().count,
          ...comment.data(),
        };
      })
    );

    setNewComment('');
    setComments(comments);
  };

  const likeComment = async (cid, isLike) => {
    const commentLikedByRef = doc(
      db,
      'users',
      uid,
      'articles',
      aid,
      'commentedBy',
      cid,
      'commentLikedBy',
      authUser.uid
    );

    if (!isLike) {
      await setDoc(commentLikedByRef, {
        aid: aid,
        cid: cid,
        auid: uid,
        uid: authUser.uid,
      });
      await setDoc(doc(db, 'users', authUser.uid, 'commentLikes', cid), {
        aid: aid,
        cid: cid,
        auid: uid,
        uid: authUser.uid,
      });

      const updatedComments = comments.map(comment =>
        comment.cid === cid
          ? { ...comment, isLike: true, likedCount: comment.likedCount + 1 }
          : comment
      );
      setComments(updatedComments);
    } else {
      await deleteDoc(commentLikedByRef);
      await deleteDoc(doc(db, 'users', authUser.uid, 'commentLikes', cid));

      const updatedComments = comments.map(comment =>
        comment.cid === cid
          ? { ...comment, isLike: false, likedCount: comment.likedCount - 1 }
          : comment
      );
      setComments(updatedComments);
    }
  };

  const deletePostAndNavigate = async () => {
    setIsPostDeleteLoading(true);
    const articleRef = doc(db, 'users', uid, 'articles', aid);
    await deleteDoc(articleRef);

    const reactions = [
      'likes',
      'stocks',
      'comments',
      'notifications',
      'commentLikes',
    ];

    const deleteReactions = async reaction => {
      const reactionQuery = query(
        collectionGroup(db, reaction),
        where('aid', '==', aid)
      );
      const docsSnap = await getDocs(reactionQuery);
      docsSnap.forEach(
        async docData =>
          await deleteDoc(
            doc(db, 'users', docData.data().auid, reaction, docData.id)
          )
      );
    };

    reactions.forEach(async reaction => await deleteReactions(reaction));
    setIsPostDeleteLoading(false);
    navigate('/');
  };

  return (
    <>
      {!article ||
      !author ||
      !editor ||
      isLikeActive === undefined ||
      isStockActive === undefined ? (
        <CommonSpinner />
      ) : (
        <VStack>
          <Helmet
            title={article.title}
            meta={[{ property: 'og:title', content: article.title }]}
          />

          <Divider orientation="horizontal" />
          <HStack
            paddingTop="3em"
            alignItems="normal"
            w="100%"
            justifyContent={isSp && 'center'}
          >
            {!isSp && (
              <StackItem w="10%">
                <VStack
                  w="100%"
                  gap="1em"
                  position="sticky"
                  top="3em"
                  paddingTop="3em"
                >
                  <Box>
                    <VStack>{displayLikes()}</VStack>
                  </Box>
                  <Box>
                    <VStack>{displayStocks()}</VStack>
                  </Box>
                  {amI && (
                    <Box>
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          icon={<Icon as={HiDotsHorizontal} />}
                          isRound={true}
                          variant="ghost"
                          colorScheme="teal"
                          size="lg"
                        />
                        <MenuList opacity="0">
                          <RouterLink to={`/editor/articles/${aid}`}>
                            <MenuItem icon={<Icon as={LuFileEdit} />}>
                              編集する
                            </MenuItem>
                          </RouterLink>
                          <MenuItem
                            isLoading={isPostDeleteLoading}
                            color="red"
                            icon={<Icon as={LuTrash2} color="red" />}
                            onClick={postDeleteModal.onOpen}
                          >
                            削除する
                          </MenuItem>

                          <Modal
                            isOpen={postDeleteModal.isOpen}
                            onClose={postDeleteModal.onClose}
                          >
                            <ModalOverlay />
                            <ModalContent>
                              <ModalHeader></ModalHeader>
                              <ModalCloseButton />

                              <ModalBody>
                                <Text>本当に削除してよろしいですか？</Text>
                              </ModalBody>
                              <ModalFooter>
                                <Button
                                  mr="1em"
                                  onClick={postDeleteModal.onClose}
                                >
                                  閉じる
                                </Button>
                                <Button
                                  colorScheme="red"
                                  onClick={() => deletePostAndNavigate()}
                                >
                                  削除する
                                </Button>
                              </ModalFooter>
                            </ModalContent>
                          </Modal>
                        </MenuList>
                      </Menu>
                    </Box>
                  )}
                </VStack>
              </StackItem>
            )}
            <StackItem w={isSp ? '90%' : '60%'}>
              <VStack>
                <Box w="100%" bg="white" borderRadius="10px">
                  <VStack padding="2em" alignItems="baseline" gap="1em">
                    <Heading as="h3" size="lg">
                      {article.title}
                    </Heading>
                    {isSp && (
                      <RouterLink to={`/users/${author.uid}`}>
                        <HStack>
                          <Avatar src={author.photoUrl} size="xs" />
                          <Text>{author.userName}</Text>
                        </HStack>
                      </RouterLink>
                    )}
                    <HStack flexWrap="wrap">
                      {article.tags.map((tag, i) => {
                        return (
                          <Tag
                            key={i}
                            as="button"
                            onClick={() => navigate(`/tag/${tag}`)}
                            _hover={{
                              backgroundColor: 'teal',
                              fontWeight: 'bold',
                              color: 'white',
                            }}
                          >
                            {tag}
                          </Tag>
                        );
                      })}
                    </HStack>

                    {isSp ? (
                      <VStack alignItems="baseline">{displayDate()}</VStack>
                    ) : (
                      <HStack>{displayDate()}</HStack>
                    )}
                    <Box w="100%">
                      <EditorContent editor={editor} />
                      {!isContentMax && (
                        <Flex
                          w="100%"
                          h="2em"
                          justifyContent="center"
                          alignItems="center"
                          mt="2em"
                        >
                          <Progress color="teal" isIndeterminate />
                        </Flex>
                      )}
                    </Box>
                  </VStack>
                </Box>
                {isSp && (
                  <Box w="100%" bg="white" borderRadius="10px">
                    <RouterLink to={`/users/${author.uid}`}>
                      <VStack padding="20px" alignItems="baseline">
                        <Text fontWeight="bold" padding="0.5em">
                          Author
                        </Text>
                        <HStack>
                          <Avatar src={author.photoUrl} />
                          <VStack alignItems="baseline">
                            <Text>{author.userName}</Text>
                            <Text whiteSpace="pre-wrap">
                              {author.selfIntroduction
                                ? author.selfIntroduction
                                : ''}
                            </Text>
                          </VStack>
                        </HStack>
                      </VStack>
                    </RouterLink>
                  </Box>
                )}
                <Box w="100%">
                  <VStack
                    w="100%"
                    justifyContent="center"
                    bg="white"
                    borderRadius="10px"
                    padding="20px"
                  >
                    <Heading padding="15px">Comments</Heading>
                    {comments.length !== 0 &&
                      comments.map(comment => {
                        return (
                          <VStack w="100%" key={comment.cid}>
                            <Divider />
                            <Flex
                              w="85%"
                              justifyContent="space-between"
                              padding="10px"
                            >
                              <HStack>
                                <RouterLink to={`/users/${comment.uid}`}>
                                  <Avatar size="sm" src={comment.photoUrl} />
                                </RouterLink>
                                <Button
                                  variant="link"
                                  color="gray"
                                  onClick={() =>
                                    navigate(`/users/${comment.uid}`)
                                  }
                                >
                                  <Text>{comment.userName}</Text>
                                </Button>
                              </HStack>
                              <HStack alignItems="center">
                                <Text fontSize="small" color="gray">
                                  {moment(comment.createdAt).format(
                                    'YYYY-MM-DD H:mm'
                                  )}
                                </Text>
                                {authUser && comment.uid === authUser.uid && (
                                  <Menu>
                                    <MenuButton
                                      as={IconButton}
                                      icon={<Icon as={HiDotsHorizontal} />}
                                      variant="ghost"
                                      color="gray"
                                      size="sm"
                                    />
                                    <MenuList opacity="0">
                                      <MenuItem
                                        onClick={() =>
                                          setComments(
                                            comments.map(e =>
                                              e.cid === comment.cid
                                                ? {
                                                    ...e,
                                                    isEditable: true,
                                                  }
                                                : e
                                            )
                                          )
                                        }
                                      >
                                        編集する
                                      </MenuItem>
                                      <MenuItem
                                        onClick={() =>
                                          storeComment(
                                            storeType.DELETE,
                                            comment
                                          )
                                        }
                                        color="red"
                                      >
                                        削除する
                                      </MenuItem>
                                    </MenuList>
                                  </Menu>
                                )}
                              </HStack>
                            </Flex>
                            <HStack
                              w="85%"
                              justifyContent="space-between"
                              padding="0 10px"
                              alignItems="flex-start"
                            >
                              {!comment.isEditable ? (
                                <Text
                                  w="90%"
                                  padding="0 10px"
                                  whiteSpace="pre-wrap"
                                  minHeight="10vh"
                                >
                                  {comment.comment}
                                </Text>
                              ) : (
                                <Textarea
                                  w="90%"
                                  value={comment.comment}
                                  onChange={e =>
                                    setComments(
                                      comments.map(item =>
                                        item.cid === comment.cid
                                          ? {
                                              ...item,
                                              comment: e.target.value,
                                            }
                                          : item
                                      )
                                    )
                                  }
                                  colorScheme="teal"
                                  padding="0 10px"
                                  overflow="hidden"
                                  minHeight="20vh"
                                />
                              )}
                              <VStack gap="0" alignItems="center">
                                <Box
                                  as={motion.div}
                                  cursor="pointer"
                                  animate={commentLikeControls}
                                  transition={{ duration: 0.2 }}
                                  onClick={() =>
                                    likeComment(comment.cid, comment.isLike)
                                  }
                                >
                                  <IconButton
                                    icon={
                                      <Icon
                                        as={
                                          comment.isLike
                                            ? TiHeartFullOutline
                                            : TiHeartOutline
                                        }
                                      />
                                    }
                                    isDisabled={
                                      authUser
                                        ? comment.uid === authUser.uid
                                        : true
                                    }
                                    variant="ghost"
                                    size="sm"
                                    colorScheme="red"
                                    isRound={true}
                                  />
                                </Box>
                                <Text color="gray">{comment.likedCount}</Text>
                              </VStack>
                            </HStack>
                            {comment.isEditable && (
                              <Flex w="85%" justifyContent="flex-end">
                                <Button
                                  variant="solid"
                                  onClick={() =>
                                    setComments(
                                      comments.map(e =>
                                        e.cid === comment.cid
                                          ? {
                                              ...e,
                                              isEditable: false,
                                            }
                                          : e
                                      )
                                    )
                                  }
                                  marginRight="10px"
                                >
                                  キャンセル
                                </Button>
                                <Button
                                  isLoading={isUpdateCommentLoading}
                                  colorScheme="teal"
                                  variant="solid"
                                  onClick={() =>
                                    storeComment(storeType.UPDATE, comment)
                                  }
                                >
                                  更新する
                                </Button>
                              </Flex>
                            )}
                          </VStack>
                        );
                      })}
                    <Divider w="100%" />
                    {authUser ? (
                      <>
                        <Flex
                          w="85%"
                          justifyContent="flex-start"
                          padding="10px"
                        >
                          <Avatar src={authUser.photoUrl} size="sm" />
                        </Flex>
                        <Textarea
                          w="90%"
                          onChange={e => setNewComment(e.target.value)}
                          padding="10px"
                          value={newComment}
                        />
                        <Flex w="90%" justifyContent="flex-end">
                          <Button
                            isLoading={isNewCommentLoading}
                            colorScheme="teal"
                            variant="solid"
                            onClick={() => storeComment(storeType.NEW)}
                          >
                            コメントする
                          </Button>
                        </Flex>
                      </>
                    ) : (
                      <>
                        <Text>ログインするとコメントすることができます。</Text>
                      </>
                    )}
                  </VStack>
                </Box>
              </VStack>
            </StackItem>
            {!isSp && (
              <StackItem w="28%">
                <VStack
                  paddingTop="30px"
                  paddingLeft="30px"
                  alignItems="flex-start"
                  position="sticky"
                  top="0"
                >
                  <Card w="75%">
                    <RouterLink to={`/users/${author.uid}`}>
                      <VStack padding="20px" alignItems="baseline">
                        <Text fontWeight="bold" padding="0.5em">
                          Author
                        </Text>
                        <VStack alignItems="baseline">
                          <HStack>
                            <Avatar src={author.photoUrl} />
                            <Text>{author.userName}</Text>
                          </HStack>
                          <Text whiteSpace="pre-wrap" fontSize="small">
                            {author.selfIntroduction}
                          </Text>
                        </VStack>
                      </VStack>
                    </RouterLink>
                  </Card>
                  {article.tocItems.length !== 0 && (
                    <Card w="75%" marginTop="1em">
                      <CardBody>
                        <ToC editor={editor} tocItems={article.tocItems} />
                      </CardBody>
                    </Card>
                  )}
                </VStack>
              </StackItem>
            )}
          </HStack>
          {isSp && (
            <HStack
              w="100%"
              bg="#f5f6f6"
              justifyContent="center"
              alignItems="center"
              gap="50px"
              position="fixed"
              bottom="0"
              height="70px"
            >
              <HStack>{displayLikes()}</HStack>
              <HStack>{displayStocks()}</HStack>
            </HStack>
          )}
        </VStack>
      )}
    </>
  );
};

export default PostDetail;
