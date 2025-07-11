"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  Target,
  Eye,
  Mail,
  Phone,
  MapPin,
  Clock,
  AlertTriangle,
  Brain,
  Timer,
  Globe,
  Award,
  Activity,
  Bot,
  Zap,
} from "lucide-react"

interface AboutPageProps {
  onBack: () => void
}

export function AboutPage({ onBack }: AboutPageProps) {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header with Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-cyan-400" />
            <span className="text-2xl font-bold text-white">SENTINEL SOC</span>
            <Badge variant="outline" className="border-cyan-500/50 text-cyan-400 text-xs">
              AI-Powered
            </Badge>
          </div>

          {/* Navigation Menu */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={onBack}
              className="text-slate-300 hover:text-cyan-400 transition-colors font-medium cursor-pointer"
            >
              Home
            </button>
            <button className="text-white hover:text-cyan-400 transition-colors font-medium cursor-pointer">
              About
            </button>
            <button
              onClick={() => scrollToSection("capabilities")}
              className="text-slate-300 hover:text-cyan-400 transition-colors font-medium cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="text-slate-300 hover:text-cyan-400 transition-colors font-medium cursor-pointer"
            >
              Contact
            </button>
          </nav>

          <Button onClick={onBack} className="bg-cyan-600 hover:bg-cyan-700">
            Access Platform
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="container mx-auto px-4 pt-12 pb-8 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="bg-cyan-600/20 text-cyan-400 border-cyan-500/30 mb-6">About SENTINEL SOC</Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-8">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              AI-Powered Security
            </span>
            <br />
            Operations Center
          </h1>
        </div>
      </section>

      {/* Company Overview */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xl text-slate-300 leading-relaxed mb-8">
            SENTINEL SOC is a next-generation Security Operations Center platform that combines artificial intelligence
            with advanced threat detection capabilities. Our comprehensive platform empowers security teams to identify,
            analyze, and respond to cyber threats faster and more effectively than ever before.
          </p>
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-white mb-4">Our Platform Excellence</h3>
            <p className="text-slate-300 leading-relaxed">
              We understand the complex cybersecurity challenges faced by modern organizations. Our SOC platform
              integrates cutting-edge AI technology with proven security operations methodologies, ensuring maximum
              effectiveness in detecting and responding to security incidents across your entire infrastructure.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardHeader>
              <div className="flex items-center mb-4">
                <Target className="w-8 h-8 text-cyan-400 mr-3" />
                <CardTitle className="text-2xl text-white">Our Mission</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 leading-relaxed">
                To provide cutting-edge AI-powered cybersecurity solutions that democratize enterprise-grade security
                operations. We believe every organization deserves access to advanced threat detection, real-time
                monitoring, and intelligent incident response capabilities to protect against evolving cyber threats.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardHeader>
              <div className="flex items-center mb-4">
                <Eye className="w-8 h-8 text-blue-400 mr-3" />
                <CardTitle className="text-2xl text-white">Our Vision</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 leading-relaxed">
                To create a world where cyber threats are detected and neutralized before they can cause harm. Through
                continuous innovation in AI and machine learning, we aim to stay ahead of cybercriminals and provide
                unparalleled security intelligence and automated response capabilities.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Key Capabilities */}
      <section id="capabilities" className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/30 mb-4">Core Capabilities</Badge>
          <h2 className="text-3xl font-bold text-white mb-4">Comprehensive Security Operations</h2>
          <p className="text-slate-300 max-w-2xl mx-auto">
            Our AI-powered platform provides complete SOC capabilities for modern cybersecurity operations
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-cyan-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Advanced Threat Detection</h3>
            <p className="text-slate-400">
              AI-powered algorithms that continuously monitor and analyze security events to detect sophisticated
              threats and anomalies in real-time.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">AI Security Assistant</h3>
            <p className="text-slate-400">
              Intelligent chatbot that provides instant security insights, threat analysis, and assists with incident
              response using natural language processing.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Automated Response</h3>
            <p className="text-slate-400">
              Intelligent automation that prioritizes threats and coordinates response actions to minimize impact and
              reduce incident response time.
            </p>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-700/50 rounded-3xl p-12 backdrop-blur-sm">
          <div className="text-center mb-8">
            <Badge className="bg-orange-600/20 text-orange-400 border-orange-500/30 mb-4">Platform Excellence</Badge>
            <h2 className="text-3xl font-bold text-white mb-4">
              Complete
              <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                {" "}
                SOC Platform
              </span>
            </h2>
            <p className="text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Our comprehensive Security Operations Center platform integrates all essential cybersecurity capabilities
              into a unified, AI-enhanced solution for modern threat landscape challenges.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <Activity className="w-12 h-12 text-orange-400 mx-auto mb-3" />
              <h4 className="text-white font-semibold mb-2">Real-time Monitoring</h4>
              <p className="text-slate-400 text-sm">Continuous security event monitoring and analysis</p>
            </div>
            <div className="text-center">
              <Brain className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
              <h4 className="text-white font-semibold mb-2">AI Intelligence</h4>
              <p className="text-slate-400 text-sm">Machine learning powered threat detection and analysis</p>
            </div>
            <div className="text-center">
              <Timer className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <h4 className="text-white font-semibold mb-2">Rapid Response</h4>
              <p className="text-slate-400 text-sm">Automated incident response and threat mitigation</p>
            </div>
            <div className="text-center">
              <Globe className="w-12 h-12 text-purple-400 mx-auto mb-3" />
              <h4 className="text-white font-semibold mb-2">Global Coverage</h4>
              <p className="text-slate-400 text-sm">Worldwide threat intelligence and security monitoring</p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-slate-800/20 border border-slate-700/30 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Protecting Organizations Worldwide</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-cyan-400 mb-2">500+</div>
              <div className="text-slate-400">Organizations Protected</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-400 mb-2">10M+</div>
              <div className="text-slate-400">Security Events Analyzed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-400 mb-2">99.9%</div>
              <div className="text-slate-400">Threat Detection Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-400 mb-2">24/7</div>
              <div className="text-slate-400">Real-Time Protection</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Experience SENTINEL SOC</h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Ready to enhance your organization's security with our AI-powered SOC platform? Explore advanced threat
            detection, real-time monitoring, and intelligent incident response capabilities.
          </p>
          <Button
            onClick={onBack}
            size="lg"
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium px-8 py-4 text-lg"
          >
            Try the Platform
          </Button>
        </div>
      </section>

      {/* Footer Section */}
      <footer id="contact" className="bg-slate-900/95 border-t border-slate-700/50">
        <div className="container mx-auto px-4 py-12">
          {/* Contact & Support Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold flex items-center text-lg">
                <Mail className="w-5 h-5 mr-2 text-cyan-400" />
                Contact Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-300 text-sm">contact@sentinelsoc.com</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-300 text-sm">+1 (555) 123-4567</span>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="w-4 h-4 text-cyan-400 mt-0.5" />
                  <div className="text-slate-300 text-sm">
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
                <li>
                  <a href="#" className="text-slate-300 hover:text-cyan-400 transition-colors text-sm">
                    SOC Operations Support
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-300 hover:text-cyan-400 transition-colors text-sm">
                    Threat Analysis Services
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-300 hover:text-cyan-400 transition-colors text-sm">
                    Incident Response
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-300 hover:text-cyan-400 transition-colors text-sm">
                    Security Consulting
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-300 hover:text-cyan-400 transition-colors text-sm">
                    Training & Certification
                  </a>
                </li>
                <li className="pt-2">
                  <div className="text-red-400 text-sm font-medium">Emergency: +1 (555) 911-SOC1</div>
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
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-slate-300 text-sm">SOC 2 Type II</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-slate-300 text-sm">ISO 27001 Certified</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-slate-300 text-sm">NIST Framework</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-slate-300 text-sm">GDPR Compliant</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-slate-300 text-sm">Global Infrastructure</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="pt-8 border-t border-slate-700/50">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0 mb-6">
              <div className="text-slate-400 text-sm">
                <div>© 2024 SENTINEL SOC. All rights reserved.</div>
                <div className="mt-1">Protecting enterprises worldwide since 2020</div>
              </div>

              <div className="flex flex-wrap gap-6">
                <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">
                  Privacy Policy
                </a>
                <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">
                  Terms of Service
                </a>
                <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">
                  Security Policy
                </a>
                <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">
                  Data Protection
                </a>
                <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">
                  Compliance
                </a>
                <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">
                  Accessibility
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
