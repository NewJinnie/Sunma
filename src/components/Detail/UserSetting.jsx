import React, { useState } from 'react';
import {
  VStack,
  Center,
  StackItem,
  Text,
  HStack,
  Input,
  ChakraProvider,
  Avatar,
  Button,
  Textarea,
  Checkbox,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import theme from '../../common/chakraTheme';
import { useAtom } from 'jotai';
import { isWelcomeAtom, authUserAtom } from '../../state/atoms';
import { Link, useNavigate } from 'react-router-dom';
import { storage, db } from '../../common/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import CommonSpinner from '../../common/CommonSpinner';
import Terms from '../Legal/Terms';
import PrivacyPolicy from '../Legal/PrivacyPolicy';

const UserSetting = () => {
  const [authUser, setAuthUser] = useAtom(authUserAtom);
  const [isWelcome, setIsWelcome] = useAtom(isWelcomeAtom);
  const [photoFile, setPhotoFile] = useState(undefined);
  const [photoUrl, setPhotoUrl] = useState(authUser ? authUser.photoUrl : '');
  const [userName, setUserName] = useState(authUser ? authUser.userName : '');
  const [displayName, setDisplayName] = useState(
    authUser ? authUser.displayName : ''
  );
  const [selfIntroduction, setSelfIntroduction] = useState(
    authUser ? authUser.selfIntroduction : ''
  );
  const [isChecked, setIsChecked] = useState(false);
  const userNameRegex = /^[a-zA-Z0-9!-/:-@¥[-`{-~]+$/;
  const [isUserNameInValid, setIsUserNameInValid] = useState(true);

  const termsModal = useDisclosure();
  const privacyPolicyModal = useDisclosure();

  const PAGE_TITLE = isWelcome ? 'Welcome' : 'Setting';
  const REGISTER_PARAGRAPH = isWelcome ? 'Sunmaをはじめる' : '設定する';
  const CANCEL_PARAGRAPH = isWelcome ? '登録を中断する' : 'マイページへ戻る';

  const navigate = useNavigate();

  const cancelRegister = () => {
    if (isWelcome) {
      setIsWelcome(false);
      setAuthUser(null);
    }
  };

  const selectFile = () => {
    const fileElem = document.getElementById('fileElem');
    fileElem.click();
  };
  const changeUserIcon = e => {
    const [file] = e.target.files;
    setPhotoFile(file);

    const photoUrl = URL.createObjectURL(file);

    setPhotoUrl(photoUrl);
  };

  const registerUserProfile = async () => {
    const usersColl = collection(db, 'users');
    const usersSnap = await getDocs(usersColl);
    const isUserNameExists = usersSnap.docs.some(
      user => user.data().userName === userName
    );

    if (isUserNameExists) {
      window.alert('既にそのユーザー名は利用されています');
    } else {
      const userObject = {
        uid: authUser.uid,
        userName: userName,
        displayName: displayName ? displayName.trim() : '',
        photoUrl: photoUrl,
        selfIntroduction: selfIntroduction ? selfIntroduction : '',
      };

      if (!photoFile) {
        await setDoc(doc(db, 'users', userObject.uid), userObject);
      } else {
        const userIconsRef = ref(
          storage,
          `users/${authUser.uid}/icon/${photoFile.name}`
        );
        await uploadBytes(userIconsRef, photoFile);
        await getDownloadURL(userIconsRef).then(url => {
          userObject.photoUrl = url;
          setDoc(doc(db, 'users', userObject.uid), userObject);
        });
      }

      setAuthUser(userObject);
      isWelcome ? setIsWelcome(false) : navigate(`/users/${authUser.uid}`);
    }
  };

  return (
    <ChakraProvider theme={theme}>
      {!authUser ? (
        <CommonSpinner />
      ) : (
        <VStack h="150vh">
          <StackItem>
            <Center h="20vh" w="100%">
              <Text fontSize="50px" fontWeight="bold">
                {PAGE_TITLE}
              </Text>
            </Center>
          </StackItem>
          <StackItem>
            <Center>
              <VStack>
                <Avatar size="2xl" src={photoUrl} marginBottom="0.3em" />
                <input
                  type="file"
                  id="fileElem"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => changeUserIcon(e)}
                />
                <Button onClick={selectFile} variant="outline">
                  <Text fontSize="small">表示アイコンを変更</Text>
                </Button>
                <Text fontSize="small" color="gray">
                  いつでも変更できます
                </Text>
              </VStack>
            </Center>
          </StackItem>
          <StackItem marginTop="2em">
            <Center>
              <VStack w="100%">
                <HStack w="100%">
                  <Text margin="0" fontSize="small">
                    ユーザー名(半角英数字記号のみ)
                  </Text>
                  <Text margin="0" fontSize="small" color="gray">
                    後から変更できません
                  </Text>
                </HStack>
                <HStack>
                  <Text margin="0" color="gray">
                    https://sunma.fun/
                  </Text>
                  <Input
                    type="text"
                    placeholder="sunma"
                    variant="filled"
                    value={userName}
                    onChange={e => {
                      setUserName(e.target.value.replace(/\s+/g, ''));
                      setIsUserNameInValid(userNameRegex.test(userName));
                    }}
                    isDisabled={isWelcome ? false : true}
                    isInvalid={!isUserNameInValid}
                  />
                </HStack>
                <HStack w="100%" marginTop="2em">
                  <Text margin="0" fontSize="small">
                    表示名
                  </Text>
                  <Text margin="0" fontSize="small" color="gray">
                    いつでも変更できます
                  </Text>
                </HStack>
                <Input
                  type="text"
                  placeholder="表示名を入力"
                  variant="filled"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                />
                <HStack w="100%" marginTop="2em">
                  <Text margin="0" fontSize="small">
                    自己紹介(任意)
                  </Text>
                  <Text margin="0" fontSize="small" color="gray">
                    いつでも変更できます
                  </Text>
                </HStack>
                <Textarea
                  resize="none"
                  variant="filled"
                  value={selfIntroduction}
                  onChange={e => setSelfIntroduction(e.target.value)}
                />
              </VStack>
            </Center>
          </StackItem>
          {isWelcome && (
            <StackItem marginTop="2em">
              <Center>
                <Checkbox
                  isChecked={isChecked}
                  colorScheme="teal"
                  onChange={() => setIsChecked(!isChecked)}
                >
                  <Button variant="link" onClick={termsModal.onOpen}>
                    利用規約
                  </Button>
                  と
                  <Button variant="link" onClick={privacyPolicyModal.onOpen}>
                    プライバシーポリシー
                  </Button>
                  に同意する
                </Checkbox>
              </Center>

              <Modal isOpen={termsModal.isOpen} onClose={termsModal.onClose}>
                <ModalOverlay />
                <ModalContent>
                  <ModalHeader></ModalHeader>
                  <ModalCloseButton />

                  <ModalBody w="100%" h="60vh">
                    <Terms isModal={true} />
                  </ModalBody>
                  <ModalFooter>
                    <Button onClick={termsModal.onClose}>閉じる</Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>

              <Modal
                isOpen={privacyPolicyModal.isOpen}
                onClose={privacyPolicyModal.onClose}
              >
                <ModalOverlay />
                <ModalContent>
                  <ModalHeader></ModalHeader>
                  <ModalCloseButton />

                  <ModalBody w="100%" h="60vh">
                    <PrivacyPolicy isModal={true} />
                  </ModalBody>
                  <ModalFooter>
                    <Button onClick={privacyPolicyModal.onClose}>閉じる</Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>
            </StackItem>
          )}
          <StackItem marginTop="2em">
            <Center>
              <Button
                isDisabled={
                  isWelcome
                    ? !isChecked ||
                      !userName ||
                      !displayName ||
                      (userName && userName.length === 0) ||
                      (displayName && displayName.length === 0) ||
                      !isUserNameInValid
                    : false
                }
                onClick={registerUserProfile}
                size="lg"
                colorScheme="teal"
                borderRadius="5em"
              >
                {REGISTER_PARAGRAPH}
              </Button>
            </Center>
          </StackItem>
          <StackItem marginTop="1em">
            <Center>
              <Link to={isWelcome ? '/' : `/users/${authUser.uid}`}>
                <Button onClick={cancelRegister} variant="link">
                  {CANCEL_PARAGRAPH}
                </Button>
              </Link>
            </Center>
          </StackItem>
        </VStack>
      )}
    </ChakraProvider>
  );
};

export default UserSetting;
