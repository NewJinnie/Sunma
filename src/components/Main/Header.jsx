import React, { useEffect, useState } from 'react';
import {
  Button,
  Center,
  Flex,
  Text,
  Avatar,
  IconButton,
  InputGroup,
  InputLeftElement,
  Input,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Icon,
  MenuDivider,
  HStack,
  StackItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  AvatarBadge,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  Box,
  Image,
} from '@chakra-ui/react';
import { auth, googleProvider, db } from '../../common/firebaseConfig';
import {
  GoogleAuthProvider,
  reauthenticateWithCredential,
  signInWithPopup,
  signOut,
  deleteUser,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
  collectionGroup,
  where,
} from 'firebase/firestore';
import { useSetAtom, useAtom, useAtomValue } from 'jotai';
import { authUserAtom, isWelcomeAtom, isSpAtom } from '../../state/atoms';
import {
  LuUser2,
  LuLogOut,
  LuSettings,
  LuSearch,
  LuFileEdit,
} from 'react-icons/lu';
import { FcGoogle } from 'react-icons/fc';
import { FaBell } from 'react-icons/fa';
import { TiUserDeleteOutline } from 'react-icons/ti';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import moment from 'moment';
import './styles.scss';
import fiscaLogo from '../../common/logo.svg';

const Header = () => {
  const [authUser, setAuthUser] = useAtom(authUserAtom);
  const setIsWelcome = useSetAtom(isWelcomeAtom);
  const isSp = useAtomValue(isSpAtom);
  const navigate = useNavigate();

  const [searchWords, setSearchWords] = useState('');
  const searchModal = useDisclosure();

  const logInModal = useDisclosure();
  const notificationDrawer = useDisclosure();
  const userDeleteModal = useDisclosure();
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const isMax = notificationCount === notifications.length;
  const [isNotificationLoading, setIsNotificationLoading] = useState(false);
  const [lastNotificationVisible, setLastNotificationVisible] =
    useState(undefined);

  const { pathname } = useLocation();

  useEffect(() => {
    setSearchWords('');
  }, [pathname]);

  const fetchNotifications = async type => {
    const setNotificationsData = async notificationsSnap => {
      const fetchedNotifications = await Promise.all(
        notificationsSnap.docs.map(async notification => {
          const userRef = doc(db, 'users', notification.data().uid);
          const articleRef = doc(
            db,
            'users',
            authUser.uid,
            'articles',
            notification.data().aid
          );
          const userSnap = await getDoc(userRef);
          const articleSnap = await getDoc(articleRef);

          return {
            nid: notification.id,
            userName: userSnap.exists()
              ? userSnap.data().userName
              : '退会したユーザー',
            photoUrl: userSnap.exists() ? userSnap.data().photoUrl : '',
            title: articleSnap.data().title,
            ...notification.data(),
          };
        })
      );

      const updatedNotifications = notifications.concat(fetchedNotifications);
      setNotifications(updatedNotifications);
    };

    const setLastVisibleData = notificationsSnap => {
      const lastVisible =
        notificationsSnap.docs[notificationsSnap.docs.length - 1];
      setLastNotificationVisible(lastVisible);
    };

    let notificationsQuery;
    let notificationsSnap;

    switch (type) {
      case 'INITIAL':
        notificationsQuery = query(
          collection(db, 'users', authUser.uid, 'notifications'),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        notificationsSnap = await getDocs(notificationsQuery);

        setLastVisibleData(notificationsSnap);
        setNotificationsData(notificationsSnap);
        break;
      case 'MORE':
        setIsNotificationLoading(true);

        notificationsQuery = query(
          collection(db, 'users', authUser.uid, 'notifications'),
          orderBy('createdAt', 'desc'),
          startAfter(lastNotificationVisible),
          limit(20)
        );
        notificationsSnap = await getDocs(notificationsQuery);

        setLastVisibleData(notificationsSnap);
        setNotificationsData(notificationsSnap);

        setIsNotificationLoading(false);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const fetchInitialNotifications = async () => {
      const notificationColl = collection(
        db,
        'users',
        authUser.uid,
        'notifications'
      );
      const notificationCollSnap = await getCountFromServer(notificationColl);
      setNotificationCount(notificationCollSnap.data().count);

      fetchNotifications('INITIAL');
    };

    authUser && fetchInitialNotifications();

    // Ignore the warning of "React Hook useEffect has a missing dependency"
    // eslint-disable-next-line
  }, [authUser]);

  const googleSignIn = async () => {
    await signInWithPopup(auth, googleProvider)
      .then(async result => {
        const FSUserRef = doc(db, 'users', result.user.uid);
        const FSUserSnap = await getDoc(FSUserRef);
        const isDb = FSUserSnap.exists();

        if (!isDb) {
          const userObject = {
            uid: result.user.uid,
            displayName: result.user.displayName,
            photoUrl: result.user.photoURL,
          };

          setAuthUser(userObject);
          setIsWelcome(true);
        }
      })
      .catch(e => console.log(e));
  };

  const googleSignOut = async () => {
    await signOut(auth).catch(e => console.log(e));
  };

  const closeNotifications = () => {
    notificationDrawer.onClose();

    notifications.forEach(
      async notification =>
        notification.isRead === false &&
        (await updateDoc(
          doc(db, 'users', authUser.uid, 'notifications', notification.nid),
          { ...notification, isRead: true }
        ))
    );

    const readNotifications = notifications.map(notification =>
      notification.isRead === false
        ? { ...notification, isRead: true }
        : notification
    );

    setNotifications(readNotifications);
  };

  const leaveFromApp = async () => {
    userDeleteModal.onClose();
    const currentUser = auth.currentUser;
    const reactionsToUser = ['likes', 'stocks', 'comments'];

    const deleteArticlesByUser = async () => {
      const articlesColl = collection(db, 'users', authUser.uid, 'articles');
      const articlesSnap = await getDocs(articlesColl);
      for (const docData of articlesSnap.docs) {
        await deleteDoc(doc(db, 'users', authUser.uid, 'articles', docData.id));
      }
    };

    const deleteReactionsTo = async reactionTo => {
      const reactionsQuery = query(
        collectionGroup(db, reactionTo),
        where('uid', '==', authUser.uid)
      );
      const reactionsSnap = await getDocs(reactionsQuery);

      for (const docData of reactionsSnap.docs) {
        await deleteDoc(
          doc(db, 'users', docData.data().auid, reactionTo, docData.id)
        );
      }
    };

    if (currentUser) {
      await signInWithPopup(auth, googleProvider).then(async result => {
        deleteDoc(doc(db, 'users', authUser.uid));
        deleteArticlesByUser();
        for (const reactionTo of reactionsToUser) {
          await deleteReactionsTo(reactionTo);
        }

        const credential = GoogleAuthProvider.credentialFromResult(result);
        reauthenticateWithCredential(currentUser, credential)
          .then(() => {
            deleteUser(currentUser)
              .then(() => {
                navigate('/');
              })
              .catch(e => console.log(e));
          })
          .catch(e => console.log(e));
      });
    }
  };

  return (
    <HStack w="80%" h="100%">
      <StackItem w="100px" marginRight="auto">
        <Link to="/">
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
        </Link>
      </StackItem>

      <StackItem w={!isSp && '300px'}>
        <Flex h="100%" w="100%" justifyContent="center" alignItems="center">
          {isSp ? (
            <>
              <IconButton
                size="lg"
                variant="ghost"
                icon={<Icon as={LuSearch} />}
                onClick={searchModal.onOpen}
              />

              <Modal isOpen={searchModal.isOpen} onClose={searchModal.onClose}>
                <ModalOverlay />
                <ModalContent>
                  <ModalHeader></ModalHeader>
                  <ModalCloseButton />

                  <ModalBody w="100%" h="15vh">
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <Icon as={LuSearch} />
                      </InputLeftElement>
                      <Input
                        type="text"
                        placeholder="記事を検索"
                        value={searchWords}
                        onChange={e => setSearchWords(e.target.value)}
                      />
                    </InputGroup>
                  </ModalBody>
                  <ModalFooter>
                    <Button onClick={searchModal.onClose} mr="1em">
                      閉じる
                    </Button>
                    <Button
                      colorScheme="teal"
                      onClick={() => {
                        searchModal.onClose();
                        navigate(`/search/${searchWords}`);
                      }}
                    >
                      検索する
                    </Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>
            </>
          ) : (
            <>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  searchWords.length > 1 && navigate(`/search/${searchWords}`);
                }}
              >
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <Icon as={LuSearch} />
                  </InputLeftElement>
                  <Input
                    type="text"
                    placeholder="記事を検索"
                    value={searchWords}
                    onChange={e => setSearchWords(e.target.value)}
                  />
                </InputGroup>
              </form>
            </>
          )}
        </Flex>
      </StackItem>

      {authUser === undefined ? (
        <></>
      ) : authUser !== null ? (
        <>
          <StackItem>
            <Flex h="100%" w="100%" justifyContent="center" alignItems="center">
              <IconButton
                size="lg"
                variant="ghost"
                colorScheme="teal"
                icon={
                  <Avatar
                    size="sm"
                    bg="white"
                    _hover={{ backgroundColor: 'teal.50' }}
                    color="teal"
                    variant="ghost"
                    icon={<Icon as={FaBell} boxSize="1.8em" />}
                    position="relative"
                  >
                    {notifications.some(
                      notification => notification.isRead === false
                    ) && (
                      <AvatarBadge
                        borderColor="papayawhip"
                        bg="red"
                        boxSize="1.3em"
                        top="0px"
                        right="5px"
                      />
                    )}
                  </Avatar>
                }
                onClick={notificationDrawer.onOpen}
              />
            </Flex>

            <Drawer
              isOpen={notificationDrawer.isOpen}
              placement="right"
              onClose={() => closeNotifications()}
            >
              <DrawerOverlay />
              <DrawerContent>
                <DrawerCloseButton />
                <DrawerHeader>通知一覧</DrawerHeader>
                <DrawerBody padding="0">
                  <VStack alignItems="flex-start">
                    {notifications.map(notification => (
                      <Link
                        key={notification.nid}
                        to={`/users/${authUser.uid}/articles/${notification.aid}`}
                        onClick={notificationDrawer.onClose}
                      >
                        <HStack
                          w="100%"
                          padding="1em"
                          className="notification-item"
                        >
                          <Avatar
                            name={notification.userName}
                            src={notification.photoUrl}
                            size="sm"
                          />
                          <VStack alignItems="baseline">
                            <Box fontSize="small">
                              <Link>
                                <span style={{ fontWeight: 'bold' }}>
                                  {notification.userName}
                                </span>
                              </Link>
                              <span>があなたの記事「</span>
                              <span style={{ fontWeight: 'bold' }}>
                                {notification.title.length > 30
                                  ? notification.title.slice(0, 30) + '...'
                                  : notification.title}
                              </span>
                              <span>」</span>
                              {notification.actionType === 'ストック' ? (
                                <span>を</span>
                              ) : (
                                <span>に</span>
                              )}
                              <span style={{ fontWeight: 'bold' }}>
                                {notification.actionType}
                              </span>
                              <span>しました。</span>
                            </Box>
                            <Text fontSize="small" color="gray">
                              {moment(notification.createdAt).format('LLL')}
                            </Text>
                          </VStack>
                        </HStack>
                      </Link>
                    ))}
                    {!isMax && (
                      <Flex
                        w="100%"
                        h="8vh"
                        justifyContent="center"
                        alignItems="center"
                      >
                        <Button
                          w="80%"
                          variant="outline"
                          colorScheme="teal"
                          onClick={() => fetchNotifications('MORE')}
                          isLoading={isNotificationLoading}
                        >
                          More
                        </Button>
                      </Flex>
                    )}
                  </VStack>
                </DrawerBody>
              </DrawerContent>
            </Drawer>
          </StackItem>

          <StackItem>
            <Flex h="100%" w="100%" justifyContent="center" alignItems="center">
              <Menu>
                <MenuButton
                  as={IconButton}
                  size="lg"
                  colorScheme="teal"
                  variant="ghost"
                  icon={<Avatar size="sm" src={authUser.photoUrl} />}
                />
                <MenuList>
                  <Link to={`/users/${authUser.uid}`}>
                    <MenuItem icon={<Icon as={LuUser2} />}>マイページ</MenuItem>
                  </Link>
                  <Link to={`/${authUser.userName}/setting`}>
                    <MenuItem icon={<Icon as={LuSettings} />}>設定</MenuItem>
                  </Link>
                  <MenuDivider />
                  <MenuItem
                    onClick={() => googleSignOut()}
                    icon={<Icon as={LuLogOut} />}
                  >
                    ログアウト
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem
                    onClick={() => userDeleteModal.onOpen()}
                    icon={<Icon as={TiUserDeleteOutline} />}
                    color="red"
                  >
                    退会する
                  </MenuItem>
                </MenuList>

                <Modal
                  isOpen={userDeleteModal.isOpen}
                  onClose={userDeleteModal.onClose}
                >
                  <ModalOverlay />
                  <ModalContent>
                    <ModalHeader />
                    <ModalCloseButton />
                    <ModalBody>
                      <Text fontSize="small">
                        退会するとデータの復元はできません。
                      </Text>
                    </ModalBody>
                    <ModalBody>
                      <Text fontSize="small">退会してよろしいですか？</Text>
                    </ModalBody>
                    <ModalBody>
                      <Text fontSize="small">※再度認証が必要です</Text>
                    </ModalBody>
                    <ModalFooter>
                      <Button
                        variant="ghost"
                        mr={3}
                        onClick={userDeleteModal.onClose}
                      >
                        Close
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => leaveFromApp()}
                        colorScheme="red"
                        leftIcon={<Icon as={TiUserDeleteOutline} boxSize={4} />}
                      >
                        退会する
                      </Button>
                    </ModalFooter>
                  </ModalContent>
                </Modal>
              </Menu>
            </Flex>
          </StackItem>

          {!isSp && (
            <StackItem>
              <Flex
                h="100%"
                w="100%"
                justifyContent="center"
                alignItems="center"
              >
                <Center>
                  <Link to="/editor/new">
                    <Button
                      colorScheme="teal"
                      variant="solid"
                      leftIcon={<Icon as={LuFileEdit} />}
                      borderRadius="3em"
                    >
                      投稿する
                    </Button>
                  </Link>
                </Center>
              </Flex>
            </StackItem>
          )}
        </>
      ) : (
        <>
          <StackItem w="80px" marginLeft="15px">
            <Button
              onClick={logInModal.onOpen}
              colorScheme="teal"
              borderRadius="5em"
            >
              Log in
            </Button>
          </StackItem>

          <Modal isOpen={logInModal.isOpen} onClose={logInModal.onClose}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader />
              <ModalCloseButton />
              <ModalBody>
                <Text fontSize="small">
                  Sunmaは会計パーソンのための情報共有コミュニティです。
                </Text>
              </ModalBody>
              <ModalBody>
                <Text fontSize="small">
                  会計に関するあなたの知見を発信、共有しよう！
                </Text>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" mr={3} onClick={logInModal.onClose}>
                  Close
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => googleSignIn()}
                  colorScheme="teal"
                  leftIcon={<Icon as={FcGoogle} boxSize={6} />}
                >
                  Googleでログイン
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </>
      )}
    </HStack>
  );
};

export default Header;
