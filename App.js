import { StatusBar } from 'expo-status-bar';
import { Foundation, Feather, MaterialIcons, AntDesign, SimpleLineIcons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, Alert, TouchableOpacity, Vibration, Image, Keyboard, Modal, KeyboardAvoidingView, Pressable, Button} from 'react-native';
import { app, database, storage } from './firebase';
import { collection, addDoc, deleteDoc, updateDoc, doc} from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, createUserWithEmailAndPassword, signOut, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import  ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  FadeInDown,
} from "react-native-reanimated";

const DURATION = 100;

let auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export default function App() {
  const Stack = createNativeStackNavigator();
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName='Login'>
        <Stack.Screen
        name='Login'
        component={LoginPage}
        options={{
          headerShown: true,
          headerTitle: '',
          headerStyle: {
            backgroundColor: '#e1eedd',
          },
          headerShadowVisible: false,
        }}
        />

        <Stack.Screen
          name='myNotes'
          component={MyNotes}
          options={{
            gestureEnabled: false,
            headerShown: true,
            headerTitle: '',
            headerStyle: {
              backgroundColor: '#e1eedd',
            },
            headerTintColor: '#fff',
            headerShadowVisible: false,
            headerRight: () => (
              <TouchableOpacity onPress={() => Alert.alert('In Progress','Modal is on its way 😎')}>
                <MaterialIcons name="settings" size={24} color="#3f3f3f" style={{ marginRight: 10 }} />
              </TouchableOpacity>
            ),
            headerBackTitleVisible: false,
            headerBackVisible: false,
            headerLeft: () => (
              <Button title='logout' onPress={() => {
                signOut()
              }} />
            )
          }}
        />
        
        <Stack.Screen 
          name='myNote'
          component={NoteDetail}
          options={{
            headerTitle: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: '400' }}>my</Text>
                <MaterialIcons name="sticky-note-2" size={40} color="#aad5aa" />
                <Text style={{ fontSize: 24, fontWeight: '400' }}>Note</Text>
              </View>
            ),
            headerStyle: {
              backgroundColor: '#e1eedd'
            },
            headerShadowVisible: false,
            headerTintColor: '#3f3f3f',
            headerTitleStyle: {
              fontWeight: '400',
              fontSize: 24
            },
            headerBackTitle: 'Back',
            headerTitleAlign: 'center',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}


const LoginPage = ({ navigation, route }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false)


  /*--- Firebase login ---*/

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if(currentUser) {
        setUser(currentUser);
        navigateToMyNotes(currentUser.uid); 
      }
    });
    return () => unsubscribe();
  }, []);


  async function login() {
    if(!email || !password) {
      Alert.alert('Attention!','Please fill out all fields');
      return
    };

    try {
      const userCredentials = await signInWithEmailAndPassword(auth, email, password);
      console.log('Logged in:', userCredentials.user.uid);
      if(userCredentials) {
        setUser(userCredentials.user);
        navigateToMyNotes(userCredentials.user.uid);
      } 
    } catch (err) {
      Alert.alert('Invalid credentials', "No account found. Check the email / passaword and try again.");
      console.log('Error in Login:', err);
    }
  }

  function navigateToMyNotes(uid) {
    navigation.navigate('myNotes', { uid: uid });
 }

  function signUpModal() {
    setModalVisible(true);
  }
  
  async function signUp() {
    if(!email || !password) {
      Alert.alert('Attention!','Please fill out all fields');
      return
    }
    try {
      const signUpCredentials = await createUserWithEmailAndPassword(auth, email, password);
      if(signUpCredentials) {
        setModalVisible(false);
      }
    } catch(err) {
      Alert.alert('Attention!', "Not valid email or password. Please try again.");
    }
  }

  return (
    <View style={styles.outerContainer}>
        <Pressable style={styles.loginContainer} onPress={Keyboard.dismiss}>
          <View style={styles.textInputContainer}>
            <Text style={ [styles.header, {marginBottom: 15}] }> 
              my <Foundation name="clipboard-notes" size={44} color="#aad5aa" /> Notebook 
            </Text>
            <TextInput style={styles.textInput} value={email} onChangeText={setEmail} placeholder='Enter email' autoCapitalize='none' clearButtonMode='always' textContentType='none' placeholderTextColor='#5d5d5d'/>
            <TextInput style={styles.textInput} value={password} onChangeText={setPassword} placeholder='Enter password' autoCapitalize='none' clearButtonMode='always' secureTextEntry placeholderTextColor='#5d5d5d'/>
            
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', width: '80%', marginTop: 10}}>
              <TouchableOpacity onPress={login}>
              <MaterialIcons name="login" size={45} color="#3f3f3f" />
              </TouchableOpacity>

              <TouchableOpacity onPress={signUpModal}>
                <AntDesign name="adduser" size={45} color="#3f3f3f" />
              </TouchableOpacity>
            </View>

          </View>
        </Pressable>


      <Modal animationType='slide' transparent={true} visible={modalVisible}>
        <KeyboardAvoidingView behavior={'paddig'} style={[styles.loginContainer]  }>
          <Pressable style={[styles.loginContainer]} onPress={Keyboard.dismiss}>
            <View style={styles.centeredView}>
              <View style={styles.modalView}>
                <Text style={styles.modalText}>Sign up</Text>
                
                <TextInput style={styles.textInput} value={email} onChangeText={setEmail} placeholder='Enter your email' placeholderTextColor='#5d5d5d' autoCapitalize='none' clearButtonMode='always'/>
                <TextInput style={styles.textInput} value={password} onChangeText={setPassword} placeholder='Enter password' placeholderTextColor='#5d5d5d' />

                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', width: '80%', marginTop: 10}}>
                  <TouchableOpacity onPress={signUp}>
                    <MaterialIcons name="add-circle" size={45} color="#3f3f3f" />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setModalVisible(!modalVisible)}>
                    <MaterialIcons name="cancel" size={45} color="#3f3f3f" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>

  );
}

const MyNotes = ({navigation, route}) => {
  const [userCollection, setUserCollection] = useState(route.params?.uid);
  const [text, setText] = useState('');
  const [values, loading, error] = useCollection(collection(database, userCollection));


  async function logout() {
    await signOut(auth);
    navigation.navigate('Login');
  }

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={logout}>
          <SimpleLineIcons name="logout" size={22} color="#3f3f3f" style={{ marginLeft: 10 }}/>
        </TouchableOpacity>
      
      ),
    });
  }, [navigation]);

  const data = values?.docs
    .map((doc) => ({...doc.data(), noteId: doc.id}))
    .sort((a,b) => b.timestamp.localeCompare(a.timestamp));

  async function createNote() { 
    try {
      if(text.trim() === '') {
        Alert.alert('Invalid Action','Cannot add a blank note!');
      } else {
        const docRef = await addDoc(collection(database, userCollection),
        { 
          note: text,
          timestamp: new Date().toISOString()
        });

        if(docRef.id) {
          setText('');
        }
      }
    } catch(error) {
      console.log('Error in Database', error);
    }
  }


  function deleteNote(noteId) {
    Vibration.vibrate(DURATION); //Adds a vibration when you try to delete
    try {
      Alert.alert('⚠️ ATTENTION! ⚠️', "You're about to delete this note?!",[
        {
          text: 'OK',
          onPress: async () => {
            await deleteDoc(doc(database, userCollection, noteId));
          }
        },
        {
          text: 'Cancel'
        }
      ]);
    } catch(error) {
      console.log('Error Deleting', error);
    }
  }
  
  useEffect(() => {
    updateNote(route.params?.noteId, route.params?.note);
  }, [navigation, route.params]);

  async function updateNote(noteId, noteText) {
    if(!noteId && !noteText) {
      return;
    }
    try {
      await updateDoc(doc(database, userCollection, noteId), {
        note: noteText,
        timestamp: new Date().toISOString()
      });
      
    } catch(error) {
      console.log("Error Updating", error);
    }
  }

  //Navigation to the note
  function updateNoteNavigateToNote(item) { // The name sucks, remember to change it
    navigation.navigate('myNote', {data: item, userCollection: userCollection});
  }

  async function onSwipeOff(noteId) {
    await deleteDoc(doc(database, userCollection, noteId));
  }

  return (
    <View style={ styles.container }>

      {/* Title */}
      <Text style={ styles.header }> 
        my <Foundation name="clipboard-notes" size={44} color="#aad5aa" /> Notebook 
      </Text>

      {/* Note creation and add */}
      <View style={ styles.inputContainer }>

        <TextInput 
          style={ styles.noteInput } 
          placeholderTextColor='#5d5d5d' 
          placeholder='New note . .'
          onChangeText={ setText }
          value={ text }
        />

        <TouchableOpacity onPress={ createNote } >
          <Feather name="plus-circle" size={40} color="#aad5aa" />
        </TouchableOpacity>
      </View>

      {/* Display notes */}
      <View style={styles.notesContainer}>

        <View style={styles.notesHeaderContainer}>
          <MaterialIcons name="notes" size={34} color="#aad5aa"/>

          <Text style={styles.notesHeaderText}> My notes:</Text>
        </View>

        <GestureHandlerRootView style={{flex: 1, justifyContent: 'center'}}>
          <FlatList
            contentContainerStyle={{padding: 5}}
            showsVerticalScrollIndicator={false}
            data={data}
            renderItem={({item}) => (
              <NoteItem key={item.noteId} item={item} onSwipeOff={onSwipeOff} 
              updateNoteNavigateToNote={updateNoteNavigateToNote} 
              deleteNote={deleteNote} />
            )}
          />
        </GestureHandlerRootView>
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const NoteItem = ({item, onSwipeOff, updateNoteNavigateToNote, deleteNote }) => {
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);

  const pan = Gesture.Pan()
    .minDistance(20)
    .onStart(() => {})
    .onUpdate((event) => {
      if(event.translationX > 0) {
        translateX.value = 0;
        rotate.value = 0;
      } else {
        translateX.value = event.translationX;
        rotate.value = (translateX.value / 250) * -10;
      }
    })
    .onEnd(() => {
      if (Math.abs(translateX.value) > 200) {
        translateX.value = withSpring(500);
        runOnJS(onSwipeOff)(item.noteId);
      } else {
        translateX.value = withSpring(0);
        rotate.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value},
        { rotate: `${rotate.value} deg`}
      ]
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[animatedStyle]} entering={FadeInDown.delay(200).springify()}>
        <View style={styles.noteContainer}>

          <View style={styles.noteInnerContainer}>
            <MaterialIcons name="sticky-note-2" size={32} color="#aad5aa" />
            
            <Text style={styles.noteTextStyle}> {item.note?.substring(0, 20)}</Text>
          </View>

          <View style={styles.noteBtnGroup}>
            <TouchableOpacity onPress={() => updateNoteNavigateToNote(item)}>
              <MaterialIcons name="edit-note" size={36} color="#3f3f3f" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => deleteNote(item.noteId)}>
              <AntDesign name="delete" size={28} color="#3f3f3f" />
            </TouchableOpacity>
          </View>

        </View>
      </Animated.View>
    </GestureDetector>
  )
}

const NoteDetail = ({navigation, route}) => {
  const data = route.params?.data;
  const userCollection = route.params?.userCollection;
  const [text, setText] = useState(data.note);
  const [edit, setEdit] = useState(false);
  const [imagePath, setImagePath] = useState(null);

  function updateNoteText() {
    const updatedNote = {...data, noteId: data.noteId, note: text };
    navigation.navigate('myNotes', updatedNote);
  }

  function openEdit() {
    !edit ? setEdit(true) : setEdit(false);
  }

  async function launchImagePicker() {
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true
    })
    
    if(!result.canceled) {
      setImagePath([{image: result.assets[0].uri},...imagePath]);
    }
  }

  // Upload image
  async function uploadImage(image) {
    const res = await fetch(image);
    const blob = await res.blob();
    
    const timeStamp = Date.now().toString();
  
    const storageRef = ref(storage, `${userCollection}/${data.noteId}/${timeStamp}.jpeg`);
  
    uploadBytes(storageRef, blob)
      .then((snapshot) => {
        Alert.alert('Success!','Image Uploaded ');
      })
      .catch((error) => {
        console.error('Error uploading image: ', error);
        
      });
  }
  
  // Downloads list of images
  async function downloadImages() {
    try {
      const listResult = await listAll(ref(storage, `${userCollection}/${data.noteId}`));
      
      const urls = [];

      await Promise.all(listResult.items.map(async (item) => {
        const url = await getDownloadURL(item);
        urls.push({ image: url });
      }));
      
      setImagePath(urls);

    } catch (error) {
      console.error('Error downloading images: ', error);
    } 
  }

  // Delete image
  async function deleteImage(image) {
    try {
      const fileName = image.split('/').pop().split('%2F').pop().split('?')[0];
      const storageRef = ref(storage, `${userCollection}/${data.noteId}/${fileName}`);
      await deleteObject(storageRef);

      const updatedUrls = imagePath.filter((url) =>  url.image !== image);
      setImagePath(updatedUrls);

      alert('Image deleted');
    } catch(error) {
      console.error('Error deleting image:', error);
      alert('Error deleting image. Please try again later.');
    }
  }

  useEffect(() => {
    downloadImages();
  },[navigation, route.params]);

  // Camera
  async function launchCamera() {
    const result = await ImagePicker.requestCameraPermissionsAsync();
    if(result.granted === false) {
      console.log("Camera not available");
    } else {
      console.log("Camera access granted");
      ImagePicker.launchCameraAsync({
        //quality: 1
      })
      .then((response) => {
        setImagePath([{image: response.assets[0].uri},...imagePath]);
      });
    }
  }


  return (
  <View style={styles.container}>
    <View style={styles.noteDetailContainer}>
      <View style={styles.noteBtnsContainer}>
        <TouchableOpacity onPress={openEdit}>
          <AntDesign name="edit" size={34} color="#3f3f3f" />
        </TouchableOpacity>

        <TouchableOpacity onPress={updateNoteText}>
          <MaterialIcons name="save-as" size={35} color="#3f3f3f" />
        </TouchableOpacity>
      </View>

      <View style={styles.noteDetailTextContainer}>
        <TextInput
          style={styles.noteDetailTextInput} 
          value={text}
          onChangeText={setText}
          multiline={true}
          textAlignVertical='top'
          editable={edit}
        />
      </View>

      <View style={[styles.noteBtnsContainer, styles.noteBtnsImage]}>
        <TouchableOpacity onPress={downloadImages}>
          <AntDesign name="clouddownloado" size={40} color="#3f3f3f" />
        </TouchableOpacity>

        <TouchableOpacity onPress={launchImagePicker} >
          <AntDesign name="picture" size={34} color="#3f3f3f" />
        </TouchableOpacity>

        <TouchableOpacity onPress={launchCamera}>
          <Feather name="camera" size={34} color="#3f3f3f" />
        </TouchableOpacity>
      </View>
    </View>

    <View style={styles.noteDetailFlatlistContainer}>
      <FlatList 
        horizontal={true}
        showsHorizontalScrollIndicator={true}
        data={imagePath}
        renderItem={({item}) => (
          <View style={styles.imageViewContainer}> 
            <Image 
              style={styles.noteDetailImage} 
              source={{ uri: item.image }}
            />
        
            <View style={styles.noteDetailImageBtn}>
              <TouchableOpacity onPress={()=> uploadImage(item.image)}>
                <AntDesign name="clouduploado" size={40} color="#3f3f3f" />
              </TouchableOpacity>
        
              <TouchableOpacity onPress={() => deleteImage(item.image)}>
                <AntDesign name="delete" size={34} color="#3f3f3f" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  </View>);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e1eedd',
    alignItems: 'center',
    justifyContent: 'top',
    paddingHorizontal: 10,
  },
  header: {
    marginTop: 0,
    fontSize: 38,
    fontWeight: '300',
    color: '#3f3f3f'
  },
  inputContainer: {
    marginTop: 18,
    flexDirection: 'row',
    borderWidth: 0,
    paddingLeft: 10,
    paddingRight: 5,
    paddingVertical: 3,
    borderRadius: 50, 
    backgroundColor: '#f2f2f2',
    width: '93%',
    gap: 5,
    borderColor: '#e6e6e6',
    alignItems: 'center'
  },
  noteInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '200',
    paddingLeft: 8,
    paddingRight: 8,
  },
  notesContainer: {
    flex: 1, 
    width: '100%', 
    paddingHorizontal: 12, 
    paddingVertical: 18, 
    marginVertical: 20
  },
  notesHeaderContainer: {
    borderBottomWidth: 1,
    borderColor: '#dcdcdc', 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap:5,
    marginLeft: 4
  }, 
  notesHeaderText: {
    fontSize: 20, 
    fontWeight: '300', 
    marginBottom: 6,
    color: '#3f3f3f', 
    flex: 1
  },
  flatlist: {
    padding: 1,
  },
  noteContainer: {
    borderWidth: 0, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 10, 
    paddingVertical: 6, 
    borderColor: '#e6e6e6', 
    borderRadius: 10,
    backgroundColor: '#f2f2f2',
    justifyContent: 'space-between'
  },
  noteInnerContainer: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5, 
    marginLeft: 4
  },
  noteTextStyle: { 
    fontSize: 18, 
    fontWeight: '200', 
    color: '#3f3f3f' 
  },
  noteBtnGroup: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginRight: 8
  },
  noteDetailContainer: {
    width: '96%', 
    marginTop: 16, 
    justifyContent: 'center'
  },
  noteBtnsContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10, 
    width: '100%', 
    gap: 26, 
    borderBottomWidth: 1, 
    borderColor: '#dcdcdc', 
    paddingBottom: 5 
  },
  noteBtnsImage: {
    marginTop: 20
  },
  noteDetailTextContainer: {
    backgroundColor: '#f2f2f2', 
    width: '100%', 
    padding: 5, 
    borderRadius: 10
  },
  noteDetailTextInput: { 
    paddingHorizontal: 8, 
    fontSize: 17, 
    maxHeight: 240, 
    marginBottom: 8, 
    marginTop: 2, 
    lineHeight: 25 
  },
  noteDetailFlatlistContainer: { 
    width: '100%', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  imageViewContainer: { 
    backgroundColor:'#aad5aa', 
    marginHorizontal: 10, 
    borderWidth: 4, 
    borderRadius: 14, 
    borderColor: '#aad5aa' 
  },
  noteDetailImage: { 
    width: 340, 
    height: 240, 
    resizeMode: 'cover', 
    borderTopLeftRadius: 10, 
    borderTopRightRadius: 10,
  },
  noteDetailImageBtn: { 
    flexDirection: 'row', 
    justifyContent: 'space-evenly', 
    marginTop: 10
  },

  /* --- Login --- */
  
  outerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e1eedd'
  },
  loginContainer: {
    flex: 1,
    width: '100%',
  },
  textInputContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 170
  },
  textInput: {
    borderWidth: 0,
    borderColor: '#e6e6e6', 
    width: '82%',
    borderWidth: 0.2,
    padding: 12,
    marginHorizontal: 5,
    marginVertical: 8,
    fontSize: 18,
    backgroundColor: '#f2f2f2',
    borderRadius: 50,
    fontWeight: '200',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 35,
    fontWeight: '600',
    color: "#3f3f3f",
  },
  modalView: {
    margin: 20,
    width: '80%',
    height: '42%',
    backgroundColor: '#e1eedd',
    borderRadius: 20,
    paddingVertical: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },

});
