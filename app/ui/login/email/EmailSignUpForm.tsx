"use client"

import { useFormState, useFormStatus } from 'react-dom';
import {
  AtSymbolIcon,
  KeyIcon,
  ExclamationCircleIcon,
  UserIcon,
  ChevronDoubleLeftIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../button';
import { authenticate, searchForUser, signUp } from '@/app/lib/actions';

import styles from './EmailSignUpForm.module.css';
import { FormEvent, useCallback, useState } from 'react';
import Link from 'next/link';

export function EmailSignUpForm() {

  const [formType, setFormType] = useState<"pending" | "sign-in" | "sign-up">("pending");
  const [email, setEmail] = useState('');
  
  return (
    <>
      {formType === "sign-in" && <SignInForm setFormType={setFormType} email={email} setEmail={setEmail}/>}
      {formType === "sign-up" && <SignUpForm setFormType={setFormType} email={email} setEmail={setEmail}/>}
      {formType === "pending" && <PendingForm setFormType={setFormType} email={email} setEmail={setEmail}/>}
    </>
  );
}


function PendingForm({
  setFormType,
  email,
  setEmail
}:{
  setFormType: Function;
  email: string;
  setEmail: Function 
}) {
  const handleContinue = useCallback(async () => {
    const user = await searchForUser(email);
    if (user) {
      setFormType("sign-in");
    } else {
      setFormType("sign-up");
    }
  },[email])

  return (
    <form action={handleContinue} className={styles.formContainer}>

      <BackToLoginButton/>

      <div className={styles.inputContainer}>
        <input
          className={styles.inputField}
          id="email"
          type="email"
          name="email"
          placeholder="Email"
          autoComplete='username'
          onChange={(e)=>setEmail(e.target.value)}
          value={email}
          required
        />
        <AtSymbolIcon className={styles.inputIcon} />
      </div>

      <ContinueButton />
    </form>
  );
}



function SignInForm({
  setFormType,
  email,
  setEmail
}:{
  setFormType: Function;
  email: string;
  setEmail: Function 
}) {

  const [isRevealed, setIsRevealed] = useState(false);

  const [errorMessage, dispatch] = useFormState(authenticate, undefined);
  
  return (
    <form action={dispatch} className={styles.formContainer}>

      <BackToPendingButton setFormType={setFormType}/>

      <div className={styles.inputContainer}>
        <input
          className={styles.inputField}
          id="email"
          type="email"
          name="email"
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          autoComplete='username'
          required
        />
        <AtSymbolIcon className={styles.inputIcon} />
      </div>
      <div className={styles.inputContainer}>
        <input
          className={styles.inputField}
          id="password"
          type={isRevealed ? "text" : "password"}
          name="password"
          placeholder="Password"
          required
          minLength={6}
          autoComplete='current-password'
        />
        <KeyIcon className={styles.inputIcon} />

        {isRevealed && <EyeIcon className={styles.passwordRevealIcon} onClick={()=>setIsRevealed(prev => !prev)}/>}
        {!isRevealed && <EyeSlashIcon className={styles.passwordRevealIcon} onClick={()=>setIsRevealed(prev => !prev)}/>}

      </div>

      <LoginButton />

      <div
        className={styles.errorMessage}
        aria-live="polite"
        aria-atomic="true"
      >
        {errorMessage && (
          <>
            <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-500">{errorMessage}</p>
          </>
        )}
      </div>
    </form>
  );
}


function SignUpForm({
  setFormType,
  email,
  setEmail
}:{
  setFormType: Function;
  email: string;
  setEmail: Function 
}) {

  const [isFirstRevealed, setIsFirstRevealed] = useState(false);
  const [isSecondRevealed, setIsSecondRevealed] = useState(false);

  const [errorMessage, dispatch] = useFormState(signUp, undefined);

  return (
    <form  action={dispatch} className={styles.formContainer}>

      <BackToPendingButton setFormType={setFormType}/>

      <div className={styles.inputContainer}>
        <input
          className={styles.inputField}
          id="name"
          type="name"
          name="name"
          placeholder="Name"
          autoComplete='username'
          required
        />
        <UserIcon className={styles.inputIcon} />
      </div>

      <div className={styles.inputContainer}>
          <input
            className={styles.inputField}
            id="email"
            type="email"
            name="email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            placeholder="Email"
            autoComplete='username'
            required
          />
          <AtSymbolIcon className={styles.inputIcon} />
      </div>
      <div className={styles.inputContainer}>
        <input
          className={styles.inputField}
          id="password1"
          type={isFirstRevealed ? "text" : "password"}
          name="password1"
          placeholder="Password"
          required
          minLength={6}
          autoComplete='new-password'
        />
        <KeyIcon className={styles.inputIcon} />

        {isFirstRevealed && <EyeIcon className={styles.passwordRevealIcon} onClick={()=>setIsFirstRevealed(prev => !prev)}/>}
        {!isFirstRevealed && <EyeSlashIcon className={styles.passwordRevealIcon} onClick={()=>setIsFirstRevealed(prev => !prev)}/>}
      </div>
      <div className={styles.inputContainer}>
        <input
          className={styles.inputField}
          id="password2"
          type={isSecondRevealed ? "text" : "password"}
          name="password2"
          placeholder="Confirm Password"
          required
          minLength={6}
          autoComplete='new-password'
        />
        <KeyIcon className={styles.inputIcon} />

        {isSecondRevealed && <EyeIcon className={styles.passwordRevealIcon} onClick={()=>setIsSecondRevealed(prev => !prev)}/>}
        {!isSecondRevealed && <EyeSlashIcon className={styles.passwordRevealIcon} onClick={()=>setIsSecondRevealed(prev => !prev)}/>}
      </div>

      <SignUpButton />

      <div
        className={styles.errorMessage}
        aria-live="polite"
        aria-atomic="true"
      >
        {errorMessage && (
          <>
            <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-500">{errorMessage}</p>
          </>
        )}
      </div>
    </form>
  );
}


function LoginButton() {
  const { pending } = useFormStatus();
  const buttonClasses = `${styles.loginButton} ${pending ? styles.loginButtonDisabled : ''}`;
  return (
    <Button className={buttonClasses} aria-disabled={pending}>
      Log in
    </Button>
  );
}

function SignUpButton() {
  const { pending } = useFormStatus();
  const buttonClasses = `${styles.loginButton} ${pending ? styles.loginButtonDisabled : ''}`;
  return (
    <Button className={buttonClasses} aria-disabled={pending}>
      Sign up
    </Button>
  );
}


function ContinueButton() {
  const { pending } = useFormStatus();
  const buttonClasses = `${styles.loginButton} ${pending ? styles.loginButtonDisabled : ''}`;
  return (
    <Button className={buttonClasses} aria-disabled={pending}>
      Continue
    </Button>
  );
}


function BackToPendingButton({setFormType}:{setFormType: Function}) {
  return (
    <span className={styles.backbutton} >
      <div className={styles.backContainer} onClick={()=>setFormType("pending")}>
        <ChevronDoubleLeftIcon className={styles.backIcon} />
        <div className={styles.backText}>Go back</div>
      </div>
    </span>
  );
}

function BackToLoginButton() {
  return (
    <Link href={"/login"} className={styles.backbutton} >
      <div className={styles.backContainer}>
        <ChevronDoubleLeftIcon className={styles.backIcon} />
        <div className={styles.backText}>Go back</div>
      </div>
    </Link>
  );
}