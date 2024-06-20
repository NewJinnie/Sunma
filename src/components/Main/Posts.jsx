import {
  Box,
  HStack,
  Card,
  CardHeader,
  Flex,
  Avatar,
  Heading,
  Text,
  CardBody,
  Link,
  CardFooter,
  Tag,
  Icon,
  Grid,
  GridItem,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  VStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { CiHeart } from 'react-icons/ci';
import { useAtomValue } from 'jotai';
import { isSpAtom, isTabletAtom } from '../../state/atoms';
import { db } from '../../common/firebaseConfig';
import {
  collectionGroup,
  query,
  getDocs,
  orderBy,
  doc,
  getDoc,
  where,
  getCountFromServer,
  collection,
} from 'firebase/firestore';
import moment from 'moment';
import {
  Link as RouterLink,
  useNavigate,
  useParams,
  useLocation,
} from 'react-router-dom';
import CommonSpinner from '../../common/CommonSpinner';
import { Helmet } from 'react-helmet';

const Posts = () => {
  const isSp = useAtomValue(isSpAtom);
  const isTablet = useAtomValue(isTabletAtom);

  const navigate = useNavigate();
  const { tag, searchWords } = useParams();
  const { pathname } = useLocation();

  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    const fetchPostsWithAuthor = async () => {
      setIsLoading(true);
      const ngram = (words, n) => {
        var i;
        var grams = [];
        for (i = 0; i <= words.length - n; i++) {
          grams.push(words.substr(i, n));
        }
        return grams;
      };
      const searchWordsForFS = searchWords && ngram(searchWords, 2);

      const articlesQuery = tag
        ? query(
            collectionGroup(db, 'articles'),
            where('tags', 'array-contains', tag),
            orderBy('createdAt', 'desc')
          )
        : searchWords
        ? query(
            collectionGroup(db, 'articles'),
            where('searchKeys', 'array-contains-any', searchWordsForFS),
            orderBy('createdAt', 'desc')
          )
        : query(collectionGroup(db, 'articles'), orderBy('createdAt', 'desc'));
      const articlesSnap = await getDocs(articlesQuery);
      const articles = await Promise.all(
        articlesSnap.docs.map(async article => {
          const authorRef = doc(db, 'users', article.data().uid);
          const authorSnap = await getDoc(authorRef);

          const likedColl = collection(
            db,
            'users',
            article.data().uid,
            'articles',
            article.id,
            'likedBy'
          );
          const likedCollSnap = await getCountFromServer(likedColl);

          return {
            aid: article.id,
            userName: authorSnap.data().userName,
            photoUrl: authorSnap.data().photoUrl,
            likedCount: likedCollSnap.data().count,
            ...article.data(),
          };
        })
      );

      setArticles(articles);
      setIsLoading(false);
    };

    setArticles([]);

    fetchPostsWithAuthor();
  }, [tag, searchWords]);

  return (
    <VStack minH="100vh">
      <Helmet title="Sunma | 会計パーソンのための情報共有コミュニティ" />

      <Tabs colorScheme="teal" w="100%">
        <VStack w="100%" justifyContent="center" bg="white">
          {(tag || searchWords) && (
            <Stat w="60%">
              <VStack
                h="15vh"
                alignItems="baseline"
                justifyContent="center"
                gap="0"
              >
                <StatLabel>{tag ? 'tag' : 'results for'}</StatLabel>
                <StatNumber>{tag ? tag : searchWords}</StatNumber>
                <StatHelpText></StatHelpText>
              </VStack>
            </Stat>
          )}
          <TabList w="100%">
            <Tab ml="10%">
              <Text fontWeight="bold">Recent</Text>
            </Tab>
          </TabList>
        </VStack>

        <TabPanels>
          <TabPanel display="flex" w="100%" justifyContent="center">
            {articles.length === 0 && isLoading ? (
              <CommonSpinner />
            ) : articles.length === 0 && !isLoading ? (
              <Text>Not Yet</Text>
            ) : (
              <Flex
                w={isSp ? '90%' : isTablet ? '90%' : '70%'}
                flexWrap="wrap"
                gap="20px"
                justifyContent="center"
              >
                {articles.map(article => (
                  <Card
                    w={isSp ? '100%' : isTablet ? '40vw' : '30vw'}
                    key={article.aid}
                  >
                    <CardHeader>
                      <Flex spacing="4">
                        <Flex
                          flex="1"
                          gap="4"
                          alignItems="center"
                          flexWrap="wrap"
                        >
                          <Link as={RouterLink} to={`/users/${article.uid}`}>
                            <Avatar
                              name={article.userName}
                              size="sm"
                              src={article.photoUrl}
                            />
                          </Link>
                          <Box>
                            <Link as={RouterLink} to={`/users/${article.uid}`}>
                              <Heading size="sm" as="h3">
                                {article.userName}
                              </Heading>
                            </Link>
                            <Text fontSize="sm" color="gray">
                              {moment(article.createdAt).format('LL')}
                            </Text>
                          </Box>
                        </Flex>
                      </Flex>
                    </CardHeader>
                    <CardBody padding="0 20px">
                      <Link
                        as={RouterLink}
                        to={`/users/${article.uid}/articles/${article.aid}`}
                      >
                        <Text fontSize="md" as="b">
                          {article.title}
                        </Text>
                      </Link>
                    </CardBody>
                    <CardFooter>
                      <Grid
                        templateColumns="repeat(6, 1fr)"
                        w="100%"
                        position="relative"
                      >
                        <GridItem colSpan={5}>
                          <HStack flexWrap="wrap">
                            {article.tags.map((tag, i) => (
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
                            ))}
                          </HStack>
                        </GridItem>
                        <GridItem
                          colSpan={1}
                          justifySelf="flex-end"
                          position="absolute"
                          bottom="0"
                        >
                          <HStack>
                            <Icon as={CiHeart} />
                            <Text color="gray">{article.likedCount}</Text>
                          </HStack>
                        </GridItem>
                      </Grid>
                    </CardFooter>
                  </Card>
                ))}
              </Flex>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
};

export default Posts;
