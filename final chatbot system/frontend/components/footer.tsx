"use client"

import { Mail, Phone, MapPin, Award, Clock, Globe } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-slate-900/95 border-t border-slate-700/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12">
        {/* Contact & Support Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 pt-8 border-t border-slate-700/50">
          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold flex items-center">
              <Mail className="w-4 h-4 mr-2 text-cyan-400" />
              Contact Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-400 text-sm">contact@sentinelsoc.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-400 text-sm">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-cyan-400 mt-0.5" />
                <div className="text-slate-400 text-sm">
                  <div>123 Security Boulevard</div>
                  <div>Cyber City, CC 12345</div>
                  <div>United States</div>
                </div>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold flex items-center">
              <Clock className="w-4 h-4 mr-2 text-cyan-400" />
              Support & Services
            </h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">
                  Technical Support
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">
                  System Status
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">
                  Professional Services
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">
                  Community Forum
                </a>
              </li>
              <li>
                <div className="text-red-400 text-sm font-medium">Emergency: +1 (555) 911-SOC1</div>
              </li>
            </ul>
          </div>

          {/* Certifications */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold flex items-center">
              <Award className="w-4 h-4 mr-2 text-cyan-400" />
              Certifications
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-green-400" />
                <span className="text-slate-400 text-sm">SOC 2 Type II</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-green-400" />
                <span className="text-slate-400 text-sm">ISO 27001</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-green-400" />
                <span className="text-slate-400 text-sm">GDPR Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-green-400" />
                <span className="text-slate-400 text-sm">HIPAA Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-blue-400" />
                <span className="text-slate-400 text-sm">Global Infrastructure</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-slate-700/50">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
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
                Cookie Policy
              </a>
              <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">
                Data Processing Agreement
              </a>
              <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">
                Security
              </a>
              <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">
                Accessibility
              </a>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-6 pt-6 border-t border-slate-700/30 text-center">
            <p className="text-slate-500 text-xs">
              Trusted by Fortune 500 companies • Processing 10B+ security events daily • Protecting 50M+ endpoints
              globally • 99.99% SLA guarantee
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
