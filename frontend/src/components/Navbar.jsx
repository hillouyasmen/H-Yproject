import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiSearch, FiX, FiHome, FiUser, FiHeart, FiShoppingCart, FiChevronDown } from "react-icons/fi";
import { GiDress } from "react-icons/gi";
import styled from 'styled-components';
import CategoryGrid from './CategoryGrid';

const Nav = styled.nav`
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 1rem 2rem;
  position: sticky;
  top: 0;
  z-index: 1000;
  direction: rtl;
`;

const NavContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled(Link)`
  font-size: 1.5rem;
  font-weight: bold;
  color: #000dff;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    color: #6b73ff;
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;
  position: relative;
`;

const NavLink = styled(Link)`
  color: #333;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;

  &:hover {
    background: #f0f0f0;
    color: #000dff;
  }

  &.active {
    background: #000dff;
    color: white;
  }

  svg {
    margin-left: 0.5rem;
  }
`;

const CategoryDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  padding: 1rem;
  margin-top: 0.5rem;
  z-index: 1000;
  min-width: 600px;
  opacity: ${props => props.isOpen ? 1 : 0};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transform: translateY(${props => props.isOpen ? '0' : '-10px'});
  transition: all 0.3s ease;
`;

const CartLink = styled(NavLink)`
  position: relative;

  .cart-count {
    position: absolute;
    top: -8px;
    right: -8px;
    background: #ff4444;
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
  }
`;

const SearchContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 1001;
  z-index: 1001;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  direction: rtl;

  &:focus {
    outline: none;
    border-color: #000dff;
  }
`;

export default function Navbar({ user, setUser }) {
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const categories = [
    { id: 1, imageUrl: '/images/body-types/rectangle.jpg', title: 'חולצות' },
    { id: 2, imageUrl: '/images/body-types/pear.jpg', title: 'מכנסיים' },
    { id: 3, imageUrl: '/images/body-types/hourglass.jpg', title: 'שמלות' },
    { id: 4, imageUrl: '/images/body-types/inverted-triangle.jpg', title: 'נעליים' },
    { id: 5, imageUrl: '/images/body-types/apple.jpg', title: 'אקססוריז' },
    { id: 6, imageUrl: '/images/body-types/athletic.jpg', title: 'תיקים' }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleClickOutside = (e) => {
    if (!e.target.closest('.category-dropdown') && !e.target.closest('.category-trigger')) {
      setIsCategoryOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setSearchQuery("");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate("/");
  };

  return (
    <Nav>
      <NavContainer>
        <Logo to="/">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            H&Y MODA
          </motion.h1>
        </Logo>

        <NavLinks>
          <NavLink to="/">
            <FiHome size={18} /> בית
          </NavLink>
          <NavLink as="div" className="category-trigger" onClick={() => setIsCategoryOpen(!isCategoryOpen)}>
            <GiDress size={18} />
            קטגוריות
            <FiChevronDown style={{ transform: isCategoryOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }} />
          </NavLink>
          <CategoryDropdown isOpen={isCategoryOpen} className="category-dropdown">
            <CategoryGrid categories={categories} />
          </CategoryDropdown>
          <NavLink to="/body-shapes">
            <GiDress size={18} /> מבנה גוף
          </NavLink>
          <NavLink to="/favorites">
            <FiHeart size={18} /> מועדפים
          </NavLink>
          
          {user ? (
            <>
              {user.role === "admin" ? (
                <NavLink to="/admin">
                  <FiUser size={18} /> ניהול
                </NavLink>
              ) : (
                <NavLink to="/profile">
                  <FiUser size={18} /> {user.username}
                </NavLink>
              )}
              <NavLink to="/" onClick={handleLogout}>
                התנתק
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/login">
                <FiUser size={18} /> התחבר
              </NavLink>
              <NavLink to="/register">
                <FiUser size={18} /> הרשמה
              </NavLink>
            </>
          )}
          
          <CartLink to="/cart">
            <FiShoppingCart size={18} />
            <span className="cart-count">0</span>
            עגלה
          </CartLink>
        </NavLinks>

        <motion.button
          onClick={toggleSearch}
          initial={false}
          animate={{ opacity: isSearchOpen ? 0 : 1 }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem'
          }}
        >
          <FiSearch size={20} />
        </motion.button>
      </NavContainer>

      {isSearchOpen && (
        <SearchContainer
          as={motion.div}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <SearchInput
            type="text"
            placeholder="חיפוש..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <NavLink
            as="button"
            onClick={handleSearch}
            style={{ background: 'none', border: 'none' }}
          >
            <FiSearch size={20} />
          </NavLink>
          <NavLink
            as="button"
            onClick={toggleSearch}
            style={{ background: 'none', border: 'none' }}
          >
            <FiX size={20} />
          </NavLink>
        </SearchContainer>
      )}
    </Nav>
  );
}
