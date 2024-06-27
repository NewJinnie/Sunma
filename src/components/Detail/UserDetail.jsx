import React, { useEffect, useState } from 'react';
import {
  VStack,
  StackItem,
  HStack,
  Avatar,
  Heading,
  Text,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Card,
  CardBody,
  CardFooter,
  Flex,
  Icon,
  Box,
  Divider,
  CardHeader,
  Link,
} from '@chakra-ui/react';
import { LuHeart, LuBookmark } from 'react-icons/lu';
import { FaRegComment } from 'react-icons/fa';
import { useAtomValue } from 'jotai';
import { authUserAtom, isSpAtom, isTabletAtom } from '../../state/atoms';
import {
  collection,
  query,
  getDocs,
  orderBy,
  getDoc,
  doc,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '../../common/firebaseConfig';
import {
  useParams,
  Link as RouterLink,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import moment from 'moment';
import CommonSpinner from '../../common/CommonSpinner';
import { Helmet } from 'react-helmet';

const UserDetail = () => {
  const authUser = useAtomValue(authUserAtom);
  const { uid } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(undefined);
  const isSp = useAtomValue(isSpAtom);
  const isTablet = useAtomValue(isTabletAtom);

  const [articles, setArticles] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [comments, setComments] = useState([]);
  const [likes, setLikes] = useState([]);
  const [stocks, setStocks] = useState([]);

  const [amI, setAmI] = useState(false);

  const [loading, setLoading] = useState(false);

  const tabLists = amI
    ? ['Articles', 'Drafts', 'Comments', 'Likes', 'Stocks']
    : ['Articles', 'Comments'];

  const tabPanels = amI
    ? [articles, drafts, comments, likes, stocks]
    : [articles, comments];

  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    const fetchUserWithArticles = async () => {
      const userRef = doc(db, 'users', uid);
      const articlesQuery = query(
        collection(db, 'users', uid, 'articles'),
        orderBy('createdAt', 'desc')
      );

      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        navigate('/notfound');
      }

      const articlesSnap = await getDocs(articlesQuery);
      const articles = await Promise.all(
        articlesSnap.docs.map(async article => {
          const likedColl = collection(
            db,
            'users',
            uid,
            'articles',
            article.id,
            'likedBy'
          );
          const stockedColl = collection(
            db,
            'users',
            uid,
            'articles',
            article.id,
            'stockedBy'
          );
          const commentedColl = collection(
            db,
            'users',
            uid,
            'articles',
            article.id,
            'commentedBy'
          );

          const likedSnap = await getCountFromServer(likedColl);
          const stockedSnap = await getCountFromServer(stockedColl);
          const commentedSnap = await getCountFromServer(commentedColl);

          return {
            ...article.data(),
            aid: article.id,
            userName: userSnap.data().userName,
            photoUrl: userSnap.data().photoUrl,
            likedCount: likedSnap.data().count,
            stockedCount: stockedSnap.data().count,
            commentedCount: commentedSnap.data().count,
          };
        })
      );

      setUser(userSnap.data());
      setArticles(articles);
    };

    fetchUserWithArticles();

    authUser && setAmI(authUser.uid === uid);
  }, [authUser, uid, navigate]);

  const fetchTabContent = async content => {
    const contentQuery = query(
      collection(db, 'users', uid, content.toLowerCase()),
      orderBy('createdAt', 'desc')
    );

    const fetchReactingArticles = reactionSnap => {
      return reactionSnap.docs.map(async reaction => {
        const { uid, aid, comment } = reaction.data();
        const userRef = doc(db, 'users', uid);
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

        const userSnap = await getDoc(userRef);
        const articleSnap = await getDoc(articleRef);
        const likedCollSnap = await getCountFromServer(likedColl);
        const stockedCollSnap = await getCountFromServer(stockedColl);
        const commentedCollSnap = await getCountFromServer(commentedColl);
        const { userName, photoUrl } = userSnap.data();
        const { title, tags, createdAt } = articleSnap.data();

        return {
          uid: uid,
          aid: aid,
          userName: userName,
          photoUrl: photoUrl,
          title: title,
          tags: tags,
          createdAt: createdAt,
          likedCount: likedCollSnap.data().count,
          stockedCount: stockedCollSnap.data().count,
          commentedCount: commentedCollSnap.data().count,
          comment: comment,
        };
      });
    };

    switch (content) {
      case 'Drafts':
        if (drafts.length === 0) {
          setLoading(true);
          const draftsSnap = await getDocs(contentQuery);
          const drafts = draftsSnap.docs.map(doc => ({
            did: doc.id,
            ...doc.data(),
          }));

          setDrafts(drafts);
          setLoading(false);
        }
        break;
      case 'Likes':
        if (likes.length === 0) {
          setLoading(true);

          const likesSnap = await getDocs(contentQuery);
          const likes = await Promise.all(fetchReactingArticles(likesSnap));

          setLikes(likes);
          setLoading(false);
        }
        break;
      case 'Stocks':
        if (stocks.length === 0) {
          setLoading(true);

          const stocksSnap = await getDocs(contentQuery);
          const stocks = await Promise.all(fetchReactingArticles(stocksSnap));

          setStocks(stocks);
          setLoading(false);
        }
        break;
      case 'Comments':
        if (comments.length === 0) {
          setLoading(true);

          const commentsSnap = await getDocs(contentQuery);
          const comments = await Promise.all(
            fetchReactingArticles(commentsSnap)
          );

          setComments(comments);
          setLoading(false);
        }
        break;
      default:
        setLoading(true);
        setLoading(false);
        break;
    }
  };

  const showCardWidth = () => {
    if (isSp) {
      return '80%';
    } else {
      if (isTablet) {
        return '49%';
      } else {
        return '30%';
      }
    }
  };

  const displayTabPanels = () => {
    return tabPanels.map((panel, i) => (
      <TabPanel key={i}>
        {loading ? (
          <Box h="80vh">読み込み中...</Box>
        ) : (
          <Flex gap="0.5em" flexWrap="wrap" justifyContent={isSp && 'center'}>
            {panel.length === 0 ? (
              <Text>Not yet</Text>
            ) : (
              panel.map((article, i) => (
                <Card key={i} w={showCardWidth()} h={isSp ? '150px' : '180px'}>
                  <CardHeader padding="10px 20px">
                    {!article.did && (
                      <HStack>
                        <Link as={RouterLink} to={`/users/${article.uid}`}>
                          <Avatar
                            name={article.userName}
                            src={article.photoUrl}
                            size="sm"
                          />
                        </Link>
                        <Link as={RouterLink} to={`/users/${article.uid}`}>
                          <Text fontSize="sm">{article.userName}</Text>
                        </Link>
                      </HStack>
                    )}
                  </CardHeader>
                  <CardBody padding="10px 20px">
                    <Link
                      as={RouterLink}
                      to={
                        article.did
                          ? `/editor/drafts/${article.did}`
                          : `/users/${article.uid}/articles/${article.aid}`
                      }
                    >
                      {article.comment ? (
                        <Link>
                          <Text as="b" fontSize="xs">
                            {article.title.length > 10
                              ? article.title.slice(0, 10) + '...'
                              : article.title}
                          </Text>
                        </Link>
                      ) : (
                        <Link>
                          <Text as="b" fontSize="sm">
                            {article.title.length > 30
                              ? article.title.slice(0, 30) + '...'
                              : article.title}
                          </Text>
                        </Link>
                      )}
                    </Link>
                    {article.comment && (
                      <Text fontSize="xs">
                        {article.comment.length > 20
                          ? article.comment.slice(0, 20) + '...'
                          : article.comment}
                      </Text>
                    )}
                  </CardBody>
                  <CardFooter w="100%" padding="10px 20px">
                    <VStack alignItems="baseline">
                      <HStack>
                        <Text fontSize="x-small">
                          {moment(article.createdAt).format('L')}
                        </Text>
                        <Icon as={LuHeart} boxSize={3} />
                        <Text fontSize="x-small">{article.likedCount}</Text>
                        <Icon as={LuBookmark} boxSize={3} />
                        <Text fontSize="x-small">{article.stockedCount}</Text>
                        <Icon as={FaRegComment} boxSize={3} />
                        <Text fontSize="x-small">{article.commentedCount}</Text>
                      </HStack>
                    </VStack>
                  </CardFooter>
                </Card>
              ))
            )}
          </Flex>
        )}
      </TabPanel>
    ));
  };

  return (
    <>
      {!user || amI === undefined ? (
        <CommonSpinner />
      ) : (
        <VStack w="100%">
          <Helmet
            title={`${user.userName} | Sunma`}
            meta={[{ name: 'description', content: user.selfIntroduction }]}
          />
          <Divider orientation="horizontal" />
          <StackItem w={isSp ? '100%' : '65%'} margin="2em">
            <HStack
              w="100%"
              gap="1em"
              justifyContent={isSp ? 'center' : 'flex-start'}
            >
              <Avatar size="xl" src={user.photoUrl} />
              <VStack alignItems="baseline" w="50%">
                <Heading as="h4" size="md">
                  {user.displayName}
                </Heading>
                <Text as="b">{user.userName}</Text>
                <Text whiteSpace="pre-wrap" w="40vw">
                  {user.selfIntroduction ? user.selfIntroduction : ''}
                </Text>
              </VStack>
            </HStack>
          </StackItem>
          <StackItem w={isSp ? '100%' : '65%'}>
            <Tabs
              colorScheme="teal"
              variant="soft-rounded"
              onChange={i => fetchTabContent(tabLists[i])}
              justifyContent="flex-start"
              minH="80vh"
            >
              <TabList flexWrap="wrap" padding={isSp && '0 15px'}>
                {tabLists.map((tab, i) => {
                  return (
                    <Tab key={i} fontSize={isSp && 'small'}>
                      {tab}
                    </Tab>
                  );
                })}
              </TabList>

              <TabPanels>{displayTabPanels()}</TabPanels>
            </Tabs>
          </StackItem>
        </VStack>
      )}
    </>
  );
};

export default UserDetail;
