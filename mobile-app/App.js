import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  FlatList,
  Dimensions,
  StatusBar,
  Modal,
  ActivityIndicator,
  Linking,
  Alert
} from 'react-native';

const { width, height } = Dimensions.get('window');
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ============= COLORS =============
const colors = {
  primary: '#0066FF',      // Blue
  background: '#0A0F1E',    // Dark blue/black
  card: '#1A1F2E',
  text: '#FFFFFF',
  textSecondary: '#8899AA',
  border: '#2A2F3E'
};

// ============= API CONFIG =============
const API_URL = 'http://192.168.1.100:5000/api'; // Replace with your server IP

// ============= SPLASH SCREEN =============
function SplashScreen({ navigation }) {
  useEffect(() => {
    setTimeout(() => {
      navigation.replace('Auth');
    }, 3000);
  }, []);

  return (
    <LinearGradient colors={[colors.background, '#000000']} style={styles.container}>
      <StatusBar hidden />
      <Text style={styles.logo}>SILA MOVIES</Text>
      <Text style={styles.slogan}>Stream Movies & Live TV</Text>
    </LinearGradient>
  );
}

// ============= AUTH SCREEN =============
function AuthScreen({ navigation }) {
  const trackUser = async () => {
    const deviceId = await AsyncStorage.getItem('deviceId');
    if (!deviceId) {
      const newId = Device.deviceName + Date.now();
      await AsyncStorage.setItem('deviceId', newId);
      await fetch(`${API_URL}/user/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: newId })
      });
    }
  };

  return (
    <LinearGradient colors={[colors.background, '#000000']} style={styles.container}>
      <View style={styles.authContainer}>
        <Text style={styles.logo}>SILA MOVIES</Text>
        <Text style={styles.welcomeText}>Karibu Sawa Rich!</Text>
        
        <TouchableOpacity style={styles.loginButton}>
          <Ionicons name="lock-closed" size={24} color="white" />
          <Text style={styles.buttonText}>🔐 LOGIN</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.guestButton}
          onPress={() => {
            trackUser();
            navigation.replace('MainTabs');
          }}
        >
          <Ionicons name="person" size={24} color="white" />
          <Text style={styles.buttonText}>👤 CONTINUE AS GUEST</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

// ============= HOME SCREEN =============
function HomeScreen({ navigation }) {
  const [trending, setTrending] = useState([]);
  const [latest, setLatest] = useState([]);
  const [popular, setPopular] = useState([]);
  const [liveTV, setLiveTV] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [trendingRes, latestRes, popularRes, liveRes] = await Promise.all([
        fetch(`${API_URL}/movies/trending`),
        fetch(`${API_URL}/movies/latest`),
        fetch(`${API_URL}/movies/popular`),
        fetch(`${API_URL}/livetv`)
      ]);
      
      setTrending(await trendingRes.json());
      setLatest(await latestRes.json());
      setPopular(await popularRes.json());
      setLiveTV(await liveRes.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const MovieCard = ({ movie }) => (
    <TouchableOpacity 
      style={styles.movieCard}
      onPress={() => navigation.navigate('MovieDetail', { movieId: movie._id })}
    >
      <Image source={{ uri: movie.poster }} style={styles.moviePoster} />
      <Text style={styles.movieTitle} numberOfLines={1}>{movie.title}</Text>
      <Text style={styles.movieYear}>{movie.year} • ⭐ {movie.rating}</Text>
    </TouchableOpacity>
  );

  const ChannelCard = ({ channel }) => (
    <TouchableOpacity 
      style={styles.channelCard}
      onPress={() => navigation.navigate('LiveTVPlayer', { channel })}
    >
      <Image source={{ uri: channel.logo }} style={styles.channelLogo} />
      <Text style={styles.channelName}>{channel.name}</Text>
      <View style={styles.liveBadge}><Text style={styles.liveText}>🔴 LIVE</Text></View>
    </TouchableOpacity>
  );

  const Section = ({ title, data, renderItem, horizontal = true }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        horizontal={horizontal}
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sectionContent}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.logoSmall}>SILA MOVIES</Text>
        <View style={styles.topIcons}>
          <TouchableOpacity onPress={() => navigation.navigate('Search')}>
            <Ionicons name="search" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="person-circle" size={28} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Trending */}
      <Section title="🔥 Trending Movies" data={trending} renderItem={({ item }) => <MovieCard movie={item} />} />

      {/* Latest */}
      <Section title="🆕 New Movies" data={latest} renderItem={({ item }) => <MovieCard movie={item} />} />

      {/* Popular */}
      <Section title="⭐ Popular" data={popular} renderItem={({ item }) => <MovieCard movie={item} />} />

      {/* Live TV */}
      <Section title="📺 Live TV" data={liveTV} renderItem={({ item }) => <ChannelCard channel={item} />} />
      
      {/* AI Chat Button */}
      <TouchableOpacity 
        style={styles.chatButton}
        onPress={() => navigation.navigate('AIChat')}
      >
        <Ionicons name="chatbubble-ellipses" size={30} color="white" />
      </TouchableOpacity>
    </ScrollView>
  );
}

// ============= MOVIE DETAIL SCREEN =============
function MovieDetailScreen({ route, navigation }) {
  const { movieId } = route.params;
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    fetchMovie();
  }, []);

  const fetchMovie = async () => {
    try {
      const res = await fetch(`${API_URL}/movies/${movieId}`);
      const data = await res.json();
      setMovie(data);
      
      // Fetch related movies (same genre)
      if (data.genre && data.genre[0]) {
        const relatedRes = await fetch(`${API_URL}/movies?genre=${data.genre[0]}&limit=6`);
        const relatedData = await relatedRes.json();
        setRelated(relatedData.filter(m => m._id !== movieId));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = () => {
    navigation.navigate('VideoPlayer', { 
      url: movie.videoUrl,
      title: movie.title,
      type: 'movie'
    });
  };

  const handleDownload = () => {
    if (movie.downloadUrl) {
      Linking.openURL(movie.downloadUrl);
    } else {
      Alert.alert('Info', 'Download link not available');
    }
  };

  const handleWatchTrailer = () => {
    if (movie.trailerUrl) {
      navigation.navigate('VideoPlayer', { 
        url: movie.trailerUrl,
        title: `${movie.title} - Trailer`,
        type: 'trailer'
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Backdrop */}
      <Image source={{ uri: movie.backdrop }} style={styles.backdrop} />
      <LinearGradient colors={['transparent', colors.background]} style={styles.backdropGradient} />
      
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      <View style={styles.movieDetailContent}>
        {/* Title and Rating */}
        <Text style={styles.detailTitle}>{movie.title}</Text>
        <View style={styles.detailMeta}>
          <Text style={styles.detailYear}>{movie.year}</Text>
          <Text style={styles.detailRating}>⭐ {movie.rating}/10</Text>
          <Text style={styles.detailDuration}>{movie.duration}</Text>
        </View>
        
        {/* Genre */}
        <View style={styles.genreContainer}>
          {movie.genre.map((g, i) => (
            <View key={i} style={styles.genreTag}>
              <Text style={styles.genreText}>{g}</Text>
            </View>
          ))}
        </View>

        {/* Description */}
        <Text style={styles.detailDescription}>{movie.description}</Text>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.playButton} onPress={handlePlay}>
            <Ionicons name="play" size={24} color="white" />
            <Text style={styles.actionText}>PLAY</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
            <Ionicons name="download" size={24} color="white" />
            <Text style={styles.actionText}>DOWNLOAD</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.trailerButton} onPress={handleWatchTrailer}>
            <Ionicons name="film" size={24} color="white" />
            <Text style={styles.actionText}>TRAILER</Text>
          </TouchableOpacity>
        </View>

        {/* Related Movies */}
        {related.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔥 Latest Trending</Text>
            <FlatList
              horizontal
              data={related}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.movieCard}
                  onPress={() => navigation.push('MovieDetail', { movieId: item._id })}
                >
                  <Image source={{ uri: item.poster }} style={styles.moviePoster} />
                  <Text style={styles.movieTitle} numberOfLines={1}>{item.title}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item._id}
              showsHorizontalScrollIndicator={false}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ============= VIDEO PLAYER =============
function VideoPlayerScreen({ route, navigation }) {
  const { url, title } = route.params;
  const video = React.useRef(null);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <TouchableOpacity style={styles.videoBackButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      
      <Video
        ref={video}
        style={styles.video}
        source={{ uri: url }}
        useNativeControls
        resizeMode="contain"
        isLooping={false}
        shouldPlay
      />
    </View>
  );
}

// ============= LIVE TV PLAYER =============
function LiveTVPlayerScreen({ route, navigation }) {
  const { channel } = route.params;
  const video = React.useRef(null);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <TouchableOpacity style={styles.videoBackButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      
      <Video
        ref={video}
        style={styles.video}
        source={{ uri: channel.streamUrl }}
        useNativeControls
        resizeMode="contain"
        shouldPlay
      />
      
      <View style={styles.channelInfo}>
        <Image source={{ uri: channel.logo }} style={styles.playerChannelLogo} />
        <Text style={styles.playerChannelName}>{channel.name}</Text>
        <View style={styles.liveBadgeLarge}><Text style={styles.liveText}>🔴 LIVE</Text></View>
      </View>
    </View>
  );
}

// ============= AI CHAT SCREEN =============
function AIChatScreen({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    const id = await AsyncStorage.getItem('deviceId') || 'unknown';
    setDeviceId(id);
    
    try {
      const res = await fetch(`${API_URL}/chat/history/${id}`);
      const data = await res.json();
      setMessages(data);
    } catch (error) {
      console.error(error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, deviceId })
      });
      
      const data = await res.json();
      const aiMessage = { role: 'ai', content: data.response };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      Alert.alert('Error', 'Failed to get response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.chatTitle}>AI Assistant</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        style={styles.chatList}
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View style={[styles.messageBubble, item.role === 'user' ? styles.userMessage : styles.aiMessage]}>
            <Text style={styles.messageText}>{item.content}</Text>
          </View>
        )}
      />

      <View style={styles.chatInput}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask me anything..."
          placeholderTextColor={colors.textSecondary}
        />
        <TouchableOpacity onPress={sendMessage} disabled={loading}>
          <Ionicons name="send" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============= SEARCH SCREEN =============
function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/movies?search=${query}`);
      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search movies..."
          placeholderTextColor={colors.textSecondary}
          onSubmitEditing={search}
          autoFocus
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={results}
          numColumns={2}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.searchResult}
              onPress={() => navigation.navigate('MovieDetail', { movieId: item._id })}
            >
              <Image source={{ uri: item.poster }} style={styles.searchPoster} />
              <Text style={styles.searchTitle}>{item.title}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item._id}
        />
      )}
    </View>
  );
}

// ============= PROFILE SCREEN =============
function ProfileScreen({ navigation }) {
  const [stats, setStats] = useState({ totalViews: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/stats`);
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error(error);
    }
  };

  const clearCache = () => {
    Alert.alert('Success', 'Cache cleared!');
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <Ionicons name="person-circle" size={80} color={colors.primary} />
        <Text style={styles.profileName}>Guest User</Text>
        <Text style={styles.profileStatus}>Free Plan</Text>
      </View>

      <View style={styles.profileStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalViews}</Text>
          <Text style={styles.statLabel}>Total Views</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>∞</Text>
          <Text style={styles.statLabel}>Movies</Text>
        </View>
      </View>

      <View style={styles.profileMenu}>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="star" size={24} color={colors.primary} />
          <Text style={styles.menuText}>Upgrade to Premium</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={clearCache}>
          <Ionicons name="trash" size={24} color={colors.primary} />
          <Text style={styles.menuText}>Clear Cache</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="document-text" size={24} color={colors.primary} />
          <Text style={styles.menuText}>Privacy Policy</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.popToTop()}>
          <Ionicons name="log-out" size={24} color={colors.primary} />
          <Text style={styles.menuText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============= MAIN TAB NAVIGATOR =============
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />
        }}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchScreen} 
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="search" size={24} color={color} />
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />
        }}
      />
    </Tab.Navigator>
  );
}

// ============= MAIN APP =============
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Auth" component={AuthScreen} />
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="MovieDetail" component={MovieDetailScreen} />
            <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} />
            <Stack.Screen name="LiveTVPlayer" component={LiveTVPlayerScreen} />
            <Stack.Screen name="AIChat" component={AIChatScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// ============= STYLES =============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Splash
  logo: {
    fontSize: 42,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
  },
  slogan: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  // Auth
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeText: {
    fontSize: 24,
    color: colors.text,
    marginBottom: 40,
  },
  loginButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  guestButton: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonText: {
    color: colors.text,
    fontSize: 18,
    marginLeft: 10,
  },
  // Home
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
  },
  logoSmall: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  topIcons: {
    flexDirection: 'row',
    gap: 15,
  },
  section: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 16,
    marginBottom: 10,
  },
  sectionContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  movieCard: {
    width: 120,
    marginRight: 10,
  },
  moviePoster: {
    width: 120,
    height: 180,
    borderRadius: 8,
    marginBottom: 5,
  },
  movieTitle: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  movieYear: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  channelCard: {
    width: 150,
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
    alignItems: 'center',
  },
  channelLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  channelName: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 5,
  },
  liveBadge: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  chatButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  // Movie Detail
  backdrop: {
    width: width,
    height: 250,
  },
  backdropGradient: {
    position: 'absolute',
    top: 150,
    left: 0,
    right: 0,
    height: 100,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  movieDetailContent: {
    padding: 16,
    marginTop: -50,
  },
  detailTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  detailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailYear: {
    color: colors.textSecondary,
    marginRight: 15,
  },
  detailRating: {
    color: '#FFD700',
    marginRight: 15,
  },
  detailDuration: {
    color: colors.textSecondary,
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  genreTag: {
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  genreText: {
    color: colors.text,
  },
  detailDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  playButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  downloadButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  trailerButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: colors.text,
    marginLeft: 5,
    fontWeight: 'bold',
  },
  // Video Player
  video: {
    flex: 1,
  },
  videoBackButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  channelInfo: {
    position: 'absolute',
    top: 40,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 8,
  },
  playerChannelLogo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  playerChannelName: {
    color: colors.text,
    marginRight: 10,
  },
  liveBadgeLarge: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  // AI Chat
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: colors.card,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  chatList: {
    flex: 1,
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  userMessage: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
  },
  aiMessage: {
    backgroundColor: colors.card,
    alignSelf: 'flex-start',
  },
  messageText: {
    color: colors.text,
  },
  chatInput: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    color: colors.text,
    padding: 12,
    borderRadius: 20,
    marginRight: 10,
  },
  // Search
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: colors.card,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.background,
    color: colors.text,
    padding: 12,
    borderRadius: 8,
    marginLeft: 10,
  },
  searchResult: {
    flex: 1,
    margin: 8,
  },
  searchPoster: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  searchTitle: {
    color: colors.text,
    marginTop: 5,
    textAlign: 'center',
  },
  // Profile
  profileHeader: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: colors.card,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 10,
  },
  profileStatus: {
    fontSize: 16,
    color: colors.primary,
    marginTop: 5,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  profileMenu: {
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 8,
    marginBottom: 10,
  },
  menuText: {
    color: colors.text,
    fontSize: 16,
    marginLeft: 15,
  },
});
