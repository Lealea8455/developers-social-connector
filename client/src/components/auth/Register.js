import React from 'react'
import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password2: ''
  });

  const { name, email, password, password2 } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();

    if (password !== password2)
      console.log('Passwords don\'t match!');
    else {
      console.log('SUCCESS');
    }
  }

  return (
    <Fragment>
      <h1 className="large text-primary">Sign Up</h1>
      <p className="lead"><i className="fas fa-user"></i> Create Your Account</p>
      <form className="form" onSubmit={e => onSubmit(e)}>
        <div className="form-group">
          <input
            type="text"
            name="name"
            placeholder="Name"
            onChange={e => onChange(e)}
            value={name}
            required
          />
        </div>
        <div className="form-group">
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            onChange={e => onChange(e)}
            value={email}
            required
          />
        </div>
        <small className="form-text">This site uses Gravatar so if you want a profile image, use a Gravatar email</small>
        <div className="form-group">
          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={e => onChange(e)}
            value={password}
            minLength="6"
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            name="password2"
            placeholder="Confirm Password"
            onChange={e => onChange(e)}
            value={password2}
            minLength="6"
          />
        </div>
        <input type="submit" className="btn btn-primary" value="Register" />
      </form>
      <p className="my-1">
        Already have an account? <Link to="/login">Sign In</Link>
      </p>
    </Fragment>
  )
}

export default Register


/*
{
      const newUser = {
        name,
        email,
        password
      }

      try {
        const config = {
          headers: {
            'Content-Type': 'application/json'
          }
        }

        const body = JSON.stringify(newUser);

        const res = await axios.post('/api/users', body, config);
        console.log(res.data);

      } catch (err) {
        console.log(err.response.data)
      }
    }

*/