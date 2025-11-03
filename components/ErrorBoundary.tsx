import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const AGM_GREEN = '#4b5320';
const AGM_DARK = '#333333';
const AGM_STONE = '#f5f1e8';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: { componentStack: string } | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

/**
 * ErrorBoundary component for catching unhandled exceptions
 * Prevents entire app from crashing on component errors
 * Implements iOS HIG error recovery patterns
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    // Log error for debugging/monitoring
    console.error('ErrorBoundary caught error:', error);
    console.error('Component stack:', errorInfo.componentStack);

    // Update state to display fallback UI
    this.setState({
      error,
      errorInfo,
    });

    // In production, you could log this to a crash reporting service
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: AGM_STONE }}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          >
            {/* Error Icon */}
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={72}
                color="#d32f2f"
                accessibilityLabel="Error"
              />
            </View>

            {/* Error Title */}
            <Text
              style={{
                fontSize: 24,
                fontWeight: '700',
                color: AGM_DARK,
                textAlign: 'center',
                marginBottom: 16,
              }}
              accessibilityRole="header"
            >
              Something Went Wrong
            </Text>

            {/* Error Message */}
            <Text
              style={{
                fontSize: 14,
                color: '#666666',
                textAlign: 'center',
                lineHeight: 20,
                marginBottom: 24,
              }}
            >
              We apologize, but an unexpected error occurred. Please try resetting the app to
              continue.
            </Text>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <View
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 24,
                  borderLeftWidth: 4,
                  borderLeftColor: '#d32f2f',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: '#d32f2f',
                    marginBottom: 8,
                  }}
                >
                  Error Details (Dev Only):
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: '#666666',
                    fontFamily: 'Courier New',
                  }}
                >
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text
                    style={{
                      fontSize: 10,
                      color: '#999999',
                      fontFamily: 'Courier New',
                      marginTop: 8,
                    }}
                  >
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}

            {/* Reset Button */}
            <TouchableOpacity
              onPress={this.handleReset}
              accessibilityLabel="Try Again"
              accessibilityRole="button"
              style={{
                backgroundColor: AGM_GREEN,
                paddingHorizontal: 32,
                paddingVertical: 16,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <MaterialCommunityIcons name="refresh" size={20} color="white" />
              <Text
                style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: '600',
                  marginLeft: 8,
                }}
              >
                Try Again
              </Text>
            </TouchableOpacity>

            {/* Support Message */}
            <Text
              style={{
                fontSize: 12,
                color: '#666666',
                textAlign: 'center',
                marginTop: 24,
                lineHeight: 18,
              }}
            >
              If this problem persists, please reach out to support through the Settings app.
            </Text>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
