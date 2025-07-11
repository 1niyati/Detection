"use client"

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  Bot,
  Activity,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  Clock,
  Star,
  CheckCircle,
  Award,
  Eye,
  Zap,
  Lock,
  TrendingUp,
  Users,
  AlertTriangle,
  UserCheck,
  Brain,
  Timer,
  MessageSquare,
} from "lucide-react"
import { ContactSection } from "./contact-section"

interface LandingPageProps {
  onGetStarted: () => void
  onLearnMore: () => void
}

export function LandingPage({ onGetStarted, onLearnMore }: LandingPageProps) {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }

  const stats = [
    { number: "500+", label: "Organizations Protected", icon: Users },
    { number: "99.9%", label: "Threat Detection Rate", icon: Shield },
    { number: "24/7", label: "Real-Time Monitoring", icon: Activity },
    { number: "10M+", label: "Security Events Analyzed", icon: UserCheck },
  ]

  const testimonials = [
    {
      quote:
        "This SOC platform has revolutionized our security operations. The AI-powered threat detection is incredibly accurate and efficient.",
      author: "Sarah Johnson",
      role: "CISO, TechCorp Industries",
      rating: 5,
    },
    {
      quote:
        "The real-time monitoring and incident response capabilities have significantly reduced our security response time.",
      author: "Michael Chen",
      role: "Security Director, Global Systems",
      rating: 5,
    },
    {
      quote:
        "Advanced anomaly detection has prevented multiple security breaches. Essential for modern enterprise security.",
      author: "Emily Rodriguez",
      role: "IT Security Manager, DataFlow Inc",
      rating: 5,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Shield className="w-8 h-8 text-cyan-400" />
              <div className="absolute inset-0 w-8 h-8 bg-cyan-400/20 rounded-full blur-md"></div>
            </div>
            <span className="text-2xl font-bold text-white">SENTINEL SOC</span>
            <Badge variant="outline" className="border-cyan-500/50 text-cyan-400 text-xs">
              AI-Powered
            </Badge>
          </div>

          {/* Navigation Menu */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection("home")}
              className="text-white hover:text-cyan-400 transition-all duration-300 font-medium cursor-pointer relative group"
            >
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-400 transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button
              onClick={onLearnMore}
              className="text-slate-300 hover:text-cyan-400 transition-all duration-300 font-medium cursor-pointer relative group"
            >
              About
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-400 transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className="text-slate-300 hover:text-cyan-400 transition-all duration-300 font-medium cursor-pointer relative group"
            >
              Features
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-400 transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="text-slate-300 hover:text-cyan-400 transition-all duration-300 font-medium cursor-pointer relative group"
            >
              Contact
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-400 transition-all duration-300 group-hover:w-full"></span>
            </button>
          </nav>

          <Button
            onClick={onGetStarted}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
          >
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="container mx-auto px-4 pt-16 pb-12 md:pt-20 md:pb-16 text-center relative">
        <div className="max-w-6xl mx-auto">
          {/* Floating Badge */}
          <div className="inline-flex items-center space-x-2 bg-slate-800/50 border border-cyan-500/30 rounded-full px-4 py-2 mb-6 backdrop-blur-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-slate-300">Advanced Security Operations Center</span>
            <Badge className="bg-cyan-600/20 text-cyan-400 border-cyan-500/30">Live</Badge>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-6 leading-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI-Powered
            </span>
            <br />
            <span className="text-white">Security Operations</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Center</span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-slate-300 mb-8 max-w-5xl mx-auto leading-relaxed font-light">
            Advanced threat detection, real-time monitoring, and intelligent security analysis powered by cutting-edge
            AI technology. Comprehensive SOC platform for modern cybersecurity operations with integrated AI assistant
            for enhanced threat response.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              onClick={() => scrollToSection("features")}
              size="lg"
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-lg px-10 py-4 h-14 font-semibold shadow-xl hover:shadow-cyan-500/25 transition-all duration-300 hover:scale-105 group"
            >
              Explore Platform
              <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              onClick={onLearnMore}
              variant="outline"
              size="lg"
              className="border-2 border-slate-600 text-slate-300 hover:bg-slate-800/50 hover:border-cyan-500 text-lg px-10 py-4 h-14 bg-transparent font-semibold transition-all duration-300 hover:scale-105 backdrop-blur-sm"
            >
              Learn More
            </Button>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 rounded-full mb-3 group-hover:scale-110 transition-transform duration-300">
                  <stat.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.number}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="container mx-auto px-4 py-16 relative">
        <div className="text-center mb-12">
          <Badge className="bg-cyan-600/20 text-cyan-400 border-cyan-500/30 mb-4">Enterprise Security Features</Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Advanced Security
            </span>
            <br />
            Operations Platform
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Comprehensive cybersecurity capabilities designed to protect organizations from evolving threats
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Bot,
              title: "AI Security Assistant",
              description:
                "Intelligent chatbot that analyzes threats, provides actionable security insights, and assists with incident response using natural language processing",
              gradient: "from-cyan-500/20 to-blue-500/20",
              iconColor: "text-cyan-400",
            },
            {
              icon: AlertTriangle,
              title: "Threat Detection & Analysis",
              description:
                "Advanced machine learning algorithms detect suspicious patterns, anomalies, and potential security threats in real-time across your infrastructure",
              gradient: "from-blue-500/20 to-purple-500/20",
              iconColor: "text-blue-400",
            },
            {
              icon: Eye,
              title: "Real-time Monitoring",
              description:
                "Live dashboard with comprehensive security metrics, threat visualization, and instant alert notifications for continuous security oversight",
              gradient: "from-purple-500/20 to-pink-500/20",
              iconColor: "text-purple-400",
            },
            {
              icon: Zap,
              title: "Automated Response",
              description:
                "Intelligent incident response automation with immediate notifications for high-risk activities and coordinated security breach responses",
              gradient: "from-yellow-500/20 to-orange-500/20",
              iconColor: "text-yellow-400",
            },
            {
              icon: Lock,
              title: "Advanced Analytics",
              description:
                "Deep security analytics with user behavior analysis, risk assessment metrics, and comprehensive reporting for informed decision making",
              gradient: "from-green-500/20 to-teal-500/20",
              iconColor: "text-green-400",
            },
            {
              icon: TrendingUp,
              title: "Predictive Intelligence",
              description:
                "AI-powered predictive analytics to forecast potential security threats and vulnerabilities before they become critical incidents",
              gradient: "from-red-500/20 to-pink-500/20",
              iconColor: "text-red-400",
            },
          ].map((feature, index) => (
            <Card
              key={index}
              className="bg-slate-800/30 border-slate-700/50 hover:border-cyan-500/50 transition-all duration-500 group backdrop-blur-sm hover:bg-slate-800/50 hover:scale-105"
            >
              <CardHeader className="relative p-6">
                <div
                  className={`w-14 h-14 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
                </div>
                <CardTitle className="text-white text-xl mb-3 group-hover:text-cyan-400 transition-colors">
                  {feature.title}
                </CardTitle>
                <CardDescription className="text-slate-400 leading-relaxed text-sm">
                  {feature.description}
                </CardDescription>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <ArrowRight className="w-5 h-5 text-cyan-400" />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* AI Chatbot Preview Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-700/50 rounded-3xl p-8 backdrop-blur-sm">
          <div className="text-center mb-8">
            <Badge className="bg-cyan-600/20 text-cyan-400 border-cyan-500/30 mb-4">AI Assistant Preview</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Meet
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {" "}
                CyberBot
              </span>
              <br />
              Your AI Security Assistant
            </h2>
            <p className="text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Experience intelligent security analysis with our advanced AI assistant. Get instant threat insights,
              security recommendations, and expert guidance for your SOC operations.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Mock Chat Interface */}
            <div className="bg-slate-900/50 border border-slate-600 rounded-2xl overflow-hidden">
              {/* Chat Header */}
              <div className="bg-slate-800/80 border-b border-slate-600 p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">CyberBot AI Security Assistant</h3>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-slate-400">Online & Ready</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mock Chat Messages */}
              <div className="p-6 space-y-4 min-h-[300px]">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="bg-cyan-600 text-white rounded-lg p-3 max-w-xs">
                    <p className="text-sm">Analyze recent security threats in our network</p>
                  </div>
                </div>

                {/* Bot Response */}
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                  <div className="bg-slate-700 border border-slate-600 rounded-lg p-3 max-w-md">
                    <p className="text-slate-100 text-sm mb-2">
                      I've analyzed your network security data and identified 3 high-priority threats:
                    </p>
                    <ul className="text-slate-300 text-xs space-y-1">
                      <li>• Suspicious login attempts from unknown IPs</li>
                      <li>• Unusual data transfer patterns detected</li>
                      <li>• Potential malware signatures found</li>
                    </ul>
                    <p className="text-cyan-400 text-xs mt-2">Would you like detailed analysis and mitigation steps?</p>
                  </div>
                </div>

                {/* User Message */}
                <div className="flex justify-end">
                  <div className="bg-cyan-600 text-white rounded-lg p-3 max-w-xs">
                    <p className="text-sm">Yes, provide detailed mitigation steps</p>
                  </div>
                </div>

                {/* Bot Typing Indicator */}
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                  <div className="bg-slate-700 border border-slate-600 rounded-lg p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Overlay for Demo */}
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center p-8">
                  <Lock className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Full AI Assistant Access</h3>
                  <p className="text-slate-300 mb-6 max-w-md">
                    Sign up to unlock the complete CyberBot AI experience with advanced threat analysis, real-time
                    security insights, and personalized recommendations.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      onClick={onGetStarted}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium px-6 py-2"
                    >
                      Get Started Free
                    </Button>
                    <Button
                      onClick={onLearnMore}
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-cyan-500 bg-transparent"
                    >
                      Learn More
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-cyan-600/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Brain className="w-6 h-6 text-cyan-400" />
                </div>
                <h4 className="text-white font-semibold mb-2">Intelligent Analysis</h4>
                <p className="text-slate-400 text-sm">
                  Advanced AI algorithms analyze security patterns and provide actionable insights
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-6 h-6 text-blue-400" />
                </div>
                <h4 className="text-white font-semibold mb-2">Natural Conversation</h4>
                <p className="text-slate-400 text-sm">
                  Ask questions in plain English and get expert security guidance instantly
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6 text-green-400" />
                </div>
                <h4 className="text-white font-semibold mb-2">Real-time Response</h4>
                <p className="text-slate-400 text-sm">
                  Get immediate answers and recommendations for security incidents and threats
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOC Capabilities Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-700/50 rounded-3xl p-10 backdrop-blur-sm">
          <div className="text-center mb-8">
            <Badge className="bg-orange-600/20 text-orange-400 border-orange-500/30 mb-4">SOC Excellence</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Complete
              <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                {" "}
                Security Operations
              </span>
              <br />
              Center Platform
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-600/20 to-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Comprehensive Protection</h3>
              <p className="text-slate-400 text-sm">
                Multi-layered security architecture with advanced threat detection, incident response, and compliance
                management
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">AI-Enhanced Operations</h3>
              <p className="text-slate-400 text-sm">
                Machine learning algorithms and AI assistant integration for intelligent threat analysis and automated
                response
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-600/20 to-teal-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Timer className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Rapid Response</h3>
              <p className="text-slate-400 text-sm">
                Real-time threat detection with automated incident response and coordinated security team collaboration
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Badge className="bg-green-600/20 text-green-400 border-green-500/30 mb-4">Success Stories</Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Trusted by Security Teams
            <br />
            <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">Worldwide</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="bg-slate-800/30 border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/50 transition-all duration-300 hover:scale-105"
            >
              <CardHeader className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-slate-300 italic mb-4 leading-relaxed text-sm">
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {testimonial.author
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">{testimonial.author}</div>
                    <div className="text-slate-400 text-xs">{testimonial.role}</div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="relative bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-700/50 rounded-3xl p-10 text-center backdrop-blur-sm overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>

          <div className="relative z-10">
            <Badge className="bg-cyan-600/20 text-cyan-400 border-cyan-500/30 mb-6">Get Started Today</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Secure Your Organization
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                with AI-Powered SOC
              </span>
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Join security teams worldwide who trust SENTINEL SOC for advanced threat detection, real-time monitoring,
              and intelligent incident response.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={onGetStarted}
                size="lg"
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold px-10 py-4 text-lg shadow-xl hover:shadow-cyan-500/25 transition-all duration-300 hover:scale-105 group"
              >
                Start Free Trial
                <CheckCircle className="ml-3 w-5 h-5 group-hover:scale-110 transition-transform" />
              </Button>
              <Button
                onClick={onLearnMore}
                variant="outline"
                size="lg"
                className="border-2 border-slate-600 text-slate-300 hover:bg-slate-800/50 hover:border-cyan-500 text-lg px-10 py-4 bg-transparent font-semibold transition-all duration-300 hover:scale-105"
              >
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <div id="contact">
        <ContactSection />
      </div>

      {/* Enhanced Footer Section */}
      <section className="bg-slate-900/95 border-t border-slate-700/50 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
        <div className="container mx-auto px-4 py-10 relative z-10">
          {/* Contact & Support Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold flex items-center text-lg">
                <Mail className="w-5 h-5 mr-2 text-cyan-400" />
                Contact Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 group">
                  <Mail className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <span className="text-slate-300 text-sm group-hover:text-cyan-400 transition-colors">
                    contact@sentinelsoc.com
                  </span>
                </div>
                <div className="flex items-center space-x-3 group">
                  <Phone className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <span className="text-slate-300 text-sm group-hover:text-cyan-400 transition-colors">
                    +1 (555) 123-4567
                  </span>
                </div>
                <div className="flex items-start space-x-3 group">
                  <MapPin className="w-4 h-4 text-cyan-400 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div className="text-slate-300 text-sm group-hover:text-cyan-400 transition-colors">
                    <div>123 Security Boulevard</div>
                    <div>Cyber City, CC 12345</div>
                    <div>United States</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Support & Services */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold flex items-center text-lg">
                <Clock className="w-5 h-5 mr-2 text-cyan-400" />
                Support & Services
              </h3>
              <ul className="space-y-2">
                {[
                  "SOC Operations Support",
                  "Threat Analysis Services",
                  "Incident Response",
                  "Security Consulting",
                  "Training & Certification",
                ].map((item, index) => (
                  <li key={index}>
                    <a
                      href="#"
                      className="text-slate-300 hover:text-cyan-400 transition-colors text-sm hover:translate-x-1 inline-block transition-transform duration-300"
                    >
                      {item}
                    </a>
                  </li>
                ))}
                <li className="pt-2">
                  <div className="text-red-400 text-sm font-medium animate-pulse">Emergency: +1 (555) 911-SOC1</div>
                </li>
              </ul>
            </div>

            {/* Certifications */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold flex items-center text-lg">
                <Award className="w-5 h-5 mr-2 text-cyan-400" />
                Compliance & Certifications
              </h3>
              <div className="space-y-3">
                {[
                  { name: "SOC 2 Type II", color: "bg-green-400" },
                  { name: "ISO 27001 Certified", color: "bg-green-400" },
                  { name: "NIST Framework", color: "bg-green-400" },
                  { name: "GDPR Compliant", color: "bg-green-400" },
                  { name: "Global Infrastructure", color: "bg-blue-400" },
                ].map((cert, index) => (
                  <div key={index} className="flex items-center space-x-3 group">
                    <div
                      className={`w-2 h-2 ${cert.color} rounded-full group-hover:scale-150 transition-transform duration-300`}
                    ></div>
                    <span className="text-slate-300 text-sm group-hover:text-cyan-400 transition-colors">
                      {cert.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="pt-6 border-t border-slate-700/50">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
              <div className="text-slate-400 text-sm">
                <div>© 2024 SENTINEL SOC. All rights reserved.</div>
                <div className="mt-1">Protecting enterprises worldwide since 2020</div>
              </div>

              <div className="flex flex-wrap gap-6">
                {[
                  "Privacy Policy",
                  "Terms of Service",
                  "Security Policy",
                  "Data Protection",
                  "Compliance",
                  "Accessibility",
                ].map((link, index) => (
                  <a
                    key={index}
                    href="#"
                    className="text-slate-400 hover:text-cyan-400 transition-colors text-sm hover:translate-y-[-2px] inline-block transition-transform duration-300"
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
