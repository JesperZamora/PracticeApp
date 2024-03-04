import { StatusBar } from 'expo-status-bar';
import { Foundation, Feather, MaterialIcons, AntDesign } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, Alert, TouchableOpacity, Vibration, Image } from 'react-native';
import { app, database, storage } from './firebase';
import { collection, addDoc, deleteDoc, updateDoc, doc} from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';

const DURATION = 100;

export default function App() {
  const Stack = createNativeStackNavigator();
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName='MyNotes'>
        <Stack.Screen
          name='myNotes'
          component={MyNotes}
          options={{
            headerShown: true,
            headerTitle: '',
            headerStyle: {
              backgroundColor: '#e1eedd',
            },
            headerTintColor: '#fff',
            headerShadowVisible: false,
            headerTitleStyle: {
              fontWeight: '400',
              fontSize: 20,
            },
            headerRight: () => (
              <TouchableOpacity onPress={() => Alert.alert('In Progress','Modal is on its way 😎')}>
                <MaterialIcons name="settings" size={24} color="#3f3f3f" style={{ marginRight: 10 }} />
              </TouchableOpacity>
            ),
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

const MyNotes = ({navigation, route}) => {
  //const [notes, setNotes] = useState([]);
  const [text, setText] = useState('');
  const [values, loading, error] = useCollection(collection(database,"notebook"));

  const data = values?.docs
    .map((doc) => ({...doc.data(), noteId: doc.id}))
    .sort((a,b) => b.timestamp.localeCompare(a.timestamp));

  async function createNote() { 
    try {
      if(text.trim() === '') {
        Alert.alert('Invalid Action','Cannot add a blank note!');
      } else {
        const docRef = await addDoc(collection(database, "notebook"),
        { note: text,
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
            await deleteDoc(doc(database, "notebook", noteId));
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
      await updateDoc(doc(database, "notebook", noteId), {
        note: noteText,
        timestamp: new Date().toISOString()
      });
      
    } catch(error) {
      console.log("Error Updating", error);
    }
  }

  //Navigation to the note
  function updateNoteNavigateToNote(item) { // The name sucks, remember to change it
    navigation.navigate('myNote', {data: item});
  }

  return (
    <View style={ styles.container }>

      {/* Title */}
      <Text style={ styles.header }> my <Foundation name="clipboard-notes" size={44} color="#aad5aa" /> Notebook </Text>

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

        <FlatList 
          style={styles.flatlist}
          showsVerticalScrollIndicator={false}
          data={data}
          renderItem={({item}) => (
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
          )}
        />
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const NoteDetail = ({navigation, route}) => {
  const data = route.params?.data;
  const [text, setText] = useState(data.note);
  const [edit, setEdit] = useState(false);
  //const [isFocused, setIsFocused] = useState(false);
  function updateNoteText() {
    const updatedNote = {...data, noteId: data.noteId, note: text };
    navigation.navigate('myNotes', updatedNote);
  }

  function openEdit() {
    !edit ? setEdit(true) : setEdit(false);
  }
  

  // Images controle state
  const [imagePath, setImagePath] = useState(null);
  //const [isPathEmpty, setIsPathEmpty] = useState(f);

  // Chosse image from device
  async function launchImagePicker() {
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true
    })
    
    if(!result.canceled) {
      setImagePath(result.assets[0].uri);
    }
  }

  
  // Upload image
  async function uploadImage() {
    const res = await fetch(imagePath);
    const blob = await res.blob();
    const storageRef = ref(storage, data.noteId +'.jpeg');
    uploadBytes(storageRef, blob).then((snapshot) => {
      alert('Image uploaded');
    }).catch((error) => {
      console.error('Error uploading image: ', error);
    });
  }

  // Listens to changes in the navigation/route and executes the downloadImage function
  useEffect(() => {
    downloadImage();
  },[navigation, route]);

  // Downlaod image
  async function downloadImage() {
    try {
      const listResult = await listAll(ref(storage));
      const imageExists = listResult.items.some(item => item.name === `${data.noteId}.jpeg`);
      
      if (!imageExists) {
        setImagePath(null);
        return;
      }

      const url = await getDownloadURL(ref(storage, `${data.noteId}.jpeg`));
      setImagePath(url);

    } catch (error) {
      alert('Error downloading image: ' + error.message);
    }
  }
  

  async function deleteImage() {
    try {
      await deleteObject(ref(storage, `${data.noteId}.jpeg`));
      setImagePath(null);
      alert('Image deleted');
    } catch(error) {
      alert('Error deleting image: ', error);
    }
  }

  

  return (
  <View style={styles.container}>
    <View style={{width: '96%', marginTop: 16, justifyContent: 'center'}}>
      <View style={{backgroundColor: '#f2f2f2', width: '100%', padding: 5, borderRadius: 10}}>
        <TextInput
          style={{ paddingHorizontal: 8, fontSize: 17, maxHeight: 260, marginBottom: 8, marginTop: 2, lineHeight: 25 }} 
          value={text}
          onChangeText={setText}
          multiline={true}
          textAlignVertical='top'
          editable={edit}
          
        />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginTop: 20, width: '100%'}}>
        <TouchableOpacity style={{}} onPress={openEdit}>
          <AntDesign name="edit" size={34} color="#3f3f3f" />
        </TouchableOpacity>

        <TouchableOpacity style={{}} onPress={updateNoteText}>
          <MaterialIcons name="save-as" size={35} color="#3f3f3f" />
        </TouchableOpacity>

        <TouchableOpacity style={{}} onPress={launchImagePicker} >
          <AntDesign name="picture" size={34} color="#3f3f3f" />
        </TouchableOpacity>

        <TouchableOpacity style={{}} onPress={uploadImage}>
          <AntDesign name="clouduploado" size={40} color="#3f3f3f" />
        </TouchableOpacity>

        <TouchableOpacity style={{}} onPress={downloadImage}>
          <AntDesign name="clouddownloado" size={40} color="#3f3f3f" />
        </TouchableOpacity>

        <TouchableOpacity style={{}} onPress={deleteImage}>
          <AntDesign name="delete" size={34} color="#3f3f3f" />
        </TouchableOpacity>
      </View>
    </View>
    {imagePath === null ? null : (
      <View style={{ padding: 6, marginTop: 25, backgroundColor: '#f2f2f2', borderRadius: 14}}> 
        <Image
          style={{ width: 300, height: 200, resizeMode: 'cover', borderRadius: 10}} 
          source={{ uri: imagePath }}
          />
      </View>
    )}
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
  addBtn: { // for later 
    fontSize: 40,
    fontWeight: '900',
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
  }
});
